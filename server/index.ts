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
} from "./db.js";
import { runEvaluation, personas } from "./agents.js";

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
  const hasKey = !!process.env.OPENROUTER_API_KEY;
  res.json({ ok: true, hasApiKey: hasKey });
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
  const sessions = listSessions.all();
  res.json(sessions);
});

// Get session detail — must be registered BEFORE the SSE route
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

  const sendEvent = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // If already complete, replay stored messages
  if (session.status === "complete" || session.status === "error") {
    const messages = getMessages.all(session.id) as Array<{
      persona: string;
      round: number;
      content: string;
    }>;
    for (const msg of messages) {
      sendEvent({
        type: "persona_response",
        persona: msg.persona,
        round: msg.round,
        content: msg.content,
      });
    }
    sendEvent({ type: "evaluation_complete", status: session.status });
    res.end();
    return;
  }

  let closed = false;
  req.on("close", () => {
    closed = true;
  });

  const safeSend = (data: Record<string, unknown>) => {
    if (!closed) sendEvent(data);
  };

  // Run evaluation and stream events
  runEvaluation(session.id, session.idea, apiKey, safeSend)
    .then(() => {
      if (!closed) res.end();
    })
    .catch((err) => {
      if (!closed) {
        safeSend({ type: "error", content: String(err) });
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
