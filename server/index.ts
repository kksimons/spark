import "dotenv/config";
import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";
import {
  createSession,
  getSession,
  listSessions,
  getMessages,
  createSpec,
  getSpec,
  updateSpec,
  insertSpecVersion,
  getSpecVersions,
} from "./db.js";
import { runEvaluation, personas, submitAnswer } from "./agents.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Serve static build in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasApiKey: !!process.env.OPENROUTER_API_KEY });
});

// Get personas list
app.get("/api/personas", (_req, res) => {
  res.json(
    personas.map((p) => ({
      id: p.id,
      name: p.name,
      department: p.department,
      role: p.role,
      icon: p.icon,
    }))
  );
});

// List sessions
app.get("/api/sessions", (_req, res) => {
  res.json(listSessions.all());
});

// Get session detail
app.get("/api/sessions/:id", (req, res) => {
  const session = getSession.get(req.params.id) as Record<string, unknown> | undefined;
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const messages = getMessages.all(req.params.id);
  res.json({ ...session, messages });
});

// Create session
app.post("/api/sessions", (req, res) => {
  const { idea } = req.body;
  if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
    res.status(400).json({ error: "Idea text is required" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENROUTER_API_KEY not configured. Add it to your .env file." });
    return;
  }

  const id = nanoid(12);
  createSession.run(id, idea.trim(), "evaluating");
  res.json({ id, idea: idea.trim(), status: "evaluating" });
});

// Submit answer to an agent's question
app.post("/api/sessions/:id/answer", (req, res) => {
  const { answer } = req.body;
  if (!answer || typeof answer !== "string") {
    res.status(400).json({ error: "Answer text is required" });
    return;
  }

  const ok = submitAnswer(req.params.id, answer.trim());
  if (!ok) {
    res.status(404).json({ error: "No pending question for this session" });
    return;
  }

  res.json({ ok: true });
});

// Get spec for a session
app.get("/api/sessions/:id/spec", (req, res) => {
  const spec = getSpec.get(req.params.id) as Record<string, unknown> | undefined;
  if (!spec) {
    res.status(404).json({ error: "Spec not found" });
    return;
  }
  res.json(spec);
});

// Create or update spec for a session
app.put("/api/sessions/:id/spec", (req, res) => {
  const { content, githubUrl } = req.body;
  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const existing = getSpec.get(req.params.id) as Record<string, unknown> | undefined;

  if (existing) {
    const newVersion = ((existing.version as number) || 1) + 1;
    insertSpecVersion.run(
      nanoid(),
      existing.id,
      existing.content as string,
      (existing.version as number) || 1
    );
    updateSpec.run(content, githubUrl || null, req.params.id);
    res.json({ ...existing, content, version: newVersion, github_url: githubUrl || null });
  } else {
    const id = nanoid();
    createSpec.run(id, req.params.id, content, 1);
    res.json({ id, session_id: req.params.id, content, version: 1, github_url: githubUrl || null });
  }
});

// Download spec as markdown file
app.get("/api/sessions/:id/spec/download", (req, res) => {
  const spec = getSpec.get(req.params.id) as
    | { session_id: string; content: string }
    | undefined;
  if (!spec) {
    res.status(404).json({ error: "Spec not found" });
    return;
  }

  const session = getSession.get(spec.session_id) as { idea: string } | undefined;
  const idea = session?.idea ?? "Untitled";

  const frontmatter = `---
title: "ENMAX Spark — Project Specification"
idea: "${idea.replace(/"/g, '\\"')}"
date: ${new Date().toISOString().split("T")[0]}
generator: ENMAX Spark
---

`;

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="spark-spec-${req.params.id}.md"`
  );
  res.send(frontmatter + spec.content);
});

// Get spec version history
app.get("/api/sessions/:id/spec/versions", (req, res) => {
  const spec = getSpec.get(req.params.id) as { id: string } | undefined;
  if (!spec) {
    res.status(404).json({ error: "Spec not found" });
    return;
  }
  const versions = getSpecVersions.all(spec.id);
  res.json(versions);
});

// SSE stream for session evaluation
app.get("/api/sessions/:id/events", (req, res) => {
  const session = getSession.get(req.params.id) as {
    id: string;
    idea: string;
    status: string;
  } | undefined;

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENROUTER_API_KEY not configured" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let closed = false;
  req.on("close", () => { closed = true; });

  const sendEvent = (data: Record<string, unknown>) => {
    if (!closed) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Replay completed sessions
  if (session.status === "complete" || session.status === "error") {
    const messages = getMessages.all(session.id) as Array<{
      persona: string;
      round: number;
      content: string;
    }>;
    for (const msg of messages) {
      if (msg.persona === "orchestrator") {
        sendEvent({ type: "synthesis", round: 3, content: msg.content });
      } else {
        sendEvent({
          type: msg.round === 1 ? "agent_response" : "discussion_message",
          persona: msg.persona,
          round: msg.round,
          content: msg.content,
        });
      }
    }
    sendEvent({ type: "evaluation_complete", status: session.status });
    res.end();
    return;
  }

  runEvaluation(session.id, session.idea, apiKey, sendEvent)
    .then(() => { if (!closed) res.end(); })
    .catch((err) => {
      if (!closed) {
        sendEvent({ type: "error", content: String(err) });
        res.end();
      }
    });
});

// Catch-all for SPA in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (_req, res) => {
    res.sendFile(path.join(process.cwd(), "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  const hasKey = !!process.env.OPENROUTER_API_KEY;
  console.log(`\n  ENMAX Spark server on http://localhost:${PORT}`);
  console.log(`  API key: ${hasKey ? "configured" : "MISSING — add OPENROUTER_API_KEY to .env"}\n`);
});
