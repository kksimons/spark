import { useState, useCallback } from "react";
import type { Session, Persona, PersonaState, SSEEvent } from "./types";
import { Header } from "./components/Header";
import { LandingInput } from "./components/LandingInput";
import { EvaluationView } from "./components/EvaluationView";
import { SessionSidebar } from "./components/SessionSidebar";

export const PERSONAS: Persona[] = [
  { id: "dayee", name: "Dayee", department: "Cybersecurity", role: "Security Analyst", icon: "shield", avatar: "/dayee.png" },
  { id: "nathan", name: "Nathan", department: "Digital Experience", role: "Infrastructure & Platform Lead", icon: "globe", avatar: "/nathan.png" },
  { id: "dana", name: "Dana", department: "Enterprise Architecture", role: "Solutions Architect", icon: "layers", avatar: "/dana.png" },
  { id: "lalindra", name: "Lalindra", department: "Design", role: "UX/UI Designer", icon: "palette", avatar: "/lalindra.png" },
  { id: "kyle", name: "Kyle", department: "Engineering", role: "Software Engineer", icon: "code", avatar: "/kyle.png" },
];

function initPersonaStates(): Record<string, PersonaState> {
  const states: Record<string, PersonaState> = {};
  for (const p of PERSONAS) {
    states[p.id] = { status: "idle", messages: [] };
  }
  return states;
}

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [personaStates, setPersonaStates] = useState<Record<string, PersonaState>>(initPersonaStates());
  const [currentRound, setCurrentRound] = useState(0);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setPersonaStates(initPersonaStates());
    setCurrentRound(0);
    setSynthesis(null);
    setError(null);
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    resetState();
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      setActiveSession(data);
      if (data.messages) {
        const states = initPersonaStates();
        for (const msg of data.messages) {
          if (msg.persona === "orchestrator") {
            setSynthesis(msg.content);
          } else if (states[msg.persona]) {
            states[msg.persona].status = "done";
            states[msg.persona].messages.push({ round: msg.round, content: msg.content });
          }
        }
        setPersonaStates(states);
        setCurrentRound(3);
      }
    } catch {
      setError("Failed to load session");
    }
  }, [resetState]);

  const startEvaluation = useCallback(async (idea: string) => {
    resetState();
    setIsEvaluating(true);
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

      const eventSource = new EventSource(`/api/sessions/${session.id}/events`);

      eventSource.onmessage = (event) => {
        const data: SSEEvent = JSON.parse(event.data);

        switch (data.type) {
          case "round_start":
            setCurrentRound(data.round ?? 0);
            break;
          case "persona_thinking":
            if (data.persona) {
              setPersonaStates((prev) => ({
                ...prev,
                [data.persona!]: { ...prev[data.persona!], status: "thinking" },
              }));
            }
            break;
          case "persona_response":
            if (data.persona && data.content) {
              setPersonaStates((prev) => ({
                ...prev,
                [data.persona!]: {
                  status: "done",
                  messages: [...(prev[data.persona!]?.messages ?? []), { round: data.round ?? 1, content: data.content! }],
                },
              }));
            }
            break;
          case "synthesis":
            if (data.content) setSynthesis(data.content);
            break;
          case "evaluation_complete":
            setIsEvaluating(false);
            setActiveSession((prev) => prev ? { ...prev, status: "complete" } : null);
            eventSource.close();
            break;
          case "error":
            setError(data.content ?? "An error occurred");
            setIsEvaluating(false);
            eventSource.close();
            break;
        }
      };

      eventSource.onerror = () => {
        setError("Connection lost. Please refresh and try again.");
        setIsEvaluating(false);
        eventSource.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsEvaluating(false);
    }
  }, [resetState]);

  const handleNewSession = useCallback(() => {
    resetState();
    setActiveSession(null);
    setIsEvaluating(false);
  }, [resetState]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onNewSession={handleNewSession} showNew={activeSession !== null} />

      <div className="flex flex-1 overflow-hidden">
        {sessions.length > 0 && (
          <SessionSidebar
            sessions={sessions}
            activeId={activeSession?.id ?? null}
            onSelect={loadSession}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          {!activeSession ? (
            <LandingInput onSubmit={startEvaluation} disabled={isEvaluating} />
          ) : (
            <EvaluationView
              session={activeSession}
              personas={PERSONAS}
              personaStates={personaStates}
              currentRound={currentRound}
              synthesis={synthesis}
              isEvaluating={isEvaluating}
              error={error}
            />
          )}
        </main>
      </div>
    </div>
  );
}
