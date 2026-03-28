import { useState, useCallback, useRef } from "react";
import type { Session, Persona, AgentState, DiscussionMsg, SSEEvent } from "./types";
import { Header } from "./components/Header";
import { LandingInput } from "./components/LandingInput";
import { EvaluationView } from "./components/EvaluationView";
import { CollapsibleSidebar } from "./components/CollapsibleSidebar";
import { Toaster, toast } from "sonner";

export const PERSONAS: Persona[] = [
  { id: "dayee", name: "Dayee", department: "Cybersecurity", role: "Security Analyst", icon: "shield", avatar: "/dayee.png" },
  { id: "nathan", name: "Nathan", department: "Digital Experience", role: "Infrastructure & Platform Lead", icon: "globe", avatar: "/nathan.png" },
  { id: "dana", name: "Dana", department: "Enterprise Architecture", role: "Solutions Architect", icon: "layers", avatar: "/dana.png" },
  { id: "lalindra", name: "Lalindra", department: "Design", role: "UX/UI Designer", icon: "palette", avatar: "/lalindra.png" },
  { id: "kyle", name: "Kyle", department: "Engineering", role: "Software Engineer", icon: "code", avatar: "/kyle.png" },
];

const personaMap = Object.fromEntries(PERSONAS.map((p) => [p.id, p]));

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Evaluation state
  const [completedAgents, setCompletedAgents] = useState<AgentState[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentState | null>(null);
  const [discussionMsgs, setDiscussionMsgs] = useState<DiscussionMsg[]>([]);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "agents" | "discussion" | "synthesis" | "complete">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isReplay, setIsReplay] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  const resetState = useCallback(() => {
    setCompletedAgents([]);
    setActiveAgent(null);
    setDiscussionMsgs([]);
    setSynthesis(null);
    setPhase("idle");
    setError(null);
    setIsReplay(false);
    eventSourceRef.current?.close();
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    resetState();
    setIsReplay(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      setActiveSession(data);

      if (data.messages) {
        const agents: AgentState[] = [];
        const disc: DiscussionMsg[] = [];
        let syn: string | null = null;

        for (const msg of data.messages) {
          if (msg.persona === "orchestrator") {
            syn = msg.content;
          } else if (msg.round === 1) {
            agents.push({
              personaId: msg.persona,
              phase: "done",
              assessment: msg.content,
              question: null,
              followup: null,
              userAnswer: null,
            });
          } else if (msg.round === 2) {
            disc.push({ personaId: msg.persona, content: msg.content });
          }
        }

        setCompletedAgents(agents);
        setDiscussionMsgs(disc);
        setSynthesis(syn);
        setPhase("complete");
      }
    } catch {
      setError("Failed to load session");
    }
  }, [resetState]);

  const handleAnswer = useCallback(async (answer: string) => {
    if (!activeSession) return;

    try {
      await fetch(`/api/sessions/${activeSession.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
    } catch {
      setError("Failed to send answer");
    }
  }, [activeSession]);

  const startEvaluation = useCallback(async (idea: string) => {
    resetState();
    setPhase("agents");
    setError(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create session");
      }

      const session: Session = await res.json();
      setActiveSession(session);
      setSessions((prev) => [session, ...prev]);

      const es = new EventSource(`/api/sessions/${session.id}/events`);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        const data: SSEEvent = JSON.parse(event.data);

        switch (data.type) {
          case "agent_enter":
            if (data.persona) {
              setActiveAgent({
                personaId: data.persona,
                phase: "entering",
                assessment: null,
                question: null,
                followup: null,
                userAnswer: null,
              });
            }
            break;

          case "agent_thinking":
            setActiveAgent((prev) =>
              prev ? { ...prev, phase: "thinking" } : prev
            );
            break;

          case "agent_response":
            if (data.content) {
              setActiveAgent((prev) =>
                prev
                  ? { ...prev, phase: "responded", assessment: data.content! }
                  : prev
              );
            }
            break;

          case "agent_question":
            if (data.content) {
              setActiveAgent((prev) =>
                prev
                  ? { ...prev, phase: "questioning", question: data.content! }
                  : prev
              );
            }
            break;

          case "user_answer":
            if (data.content) {
              setActiveAgent((prev) =>
                prev
                  ? { ...prev, phase: "waiting", userAnswer: data.content! }
                  : prev
              );
            }
            break;

          case "agent_followup":
            if (data.content) {
              setActiveAgent((prev) =>
                prev
                  ? { ...prev, phase: "followup", followup: data.content! }
                  : prev
              );
            }
            break;

          case "agent_done":
            setActiveAgent((current) => {
              if (current) {
                setCompletedAgents((prev) => {
                  if (prev.some((a) => a.personaId === current.personaId)) return prev;
                  return [...prev, { ...current, phase: "done" }];
                });
              }
              return null;
            });
            break;

          case "round_start":
            if (data.round === 2) setPhase("discussion");
            if (data.round === 3) setPhase("synthesis");
            break;

          case "discussion_message":
            if (data.persona && data.content) {
              setDiscussionMsgs((prev) => {
                if (prev.some((m) => m.personaId === data.persona)) return prev;
                return [...prev, { personaId: data.persona!, content: data.content! }];
              });
            }
            break;

          case "synthesis":
            if (data.content) setSynthesis(data.content);
            break;

          case "evaluation_complete":
            setPhase("complete");
            setActiveSession((prev) =>
              prev ? { ...prev, status: "complete" } : null
            );
            es.close();
            break;

          case "error":
            toast.error(data.content ?? "An error occurred");
            setPhase("idle");
            es.close();
            break;
        }
      };

      es.onerror = () => {
        toast.error("Connection lost. Please refresh.");
        setPhase("idle");
        es.close();
      };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setPhase("idle");
    }
  }, [resetState]);

  const handleNewSession = useCallback(() => {
    resetState();
    setActiveSession(null);
  }, [resetState]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-center" />
      <Header
        onNewSession={handleNewSession}
        showNew={activeSession !== null}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        hasSessions={sessions.length > 0}
      />

      <div className="flex flex-1 overflow-hidden">
        <CollapsibleSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sessions={sessions}
          activeId={activeSession?.id ?? null}
          onSelect={(id) => {
            loadSession(id);
            setSidebarOpen(false);
          }}
        />

        <main className="flex-1 overflow-y-auto">
          {!activeSession ? (
            <LandingInput
              onSubmit={startEvaluation}
              disabled={phase !== "idle"}
            />
          ) : (
            <EvaluationView
              session={activeSession}
              personas={PERSONAS}
              personaMap={personaMap}
              completedAgents={completedAgents}
              activeAgent={activeAgent}
              discussionMsgs={discussionMsgs}
              synthesis={synthesis}
              phase={phase}
              error={error}
              isReplay={isReplay}
              onAnswer={handleAnswer}
            />
          )}
        </main>
      </div>
    </div>
  );
}
