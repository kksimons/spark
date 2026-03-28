import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Persona, AgentState, DiscussionMsg, Session } from "../types";
import { IdeaCard } from "./IdeaCard";
import { AgentCard } from "./AgentCard";
import { CompletedAgentRow } from "./CompletedAgentRow";
import { DiscussionSection } from "./DiscussionSection";
import { SynthesisCard } from "./SynthesisCard";

interface EvaluationViewProps {
  session: Session;
  personas: Persona[];
  personaMap: Record<string, Persona>;
  completedAgents: AgentState[];
  activeAgent: AgentState | null;
  discussionMsgs: DiscussionMsg[];
  synthesis: string | null;
  phase: "idle" | "agents" | "discussion" | "synthesis" | "complete";
  error: string | null;
  isReplay: boolean;
  onAnswer: (answer: string) => void;
}

export function EvaluationView({
  session,
  personas,
  personaMap,
  completedAgents,
  activeAgent,
  discussionMsgs,
  synthesis,
  phase,
  error,
  isReplay,
  onAnswer,
}: EvaluationViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (discussionMsgs.length > 0 || synthesis) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 200);
    }
  }, [discussionMsgs.length, synthesis]);

  const showingTimeline =
    completedAgents.length > 0 || discussionMsgs.length > 0 || synthesis;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Idea banner — top, with padding */}
      <div className="px-6 sm:px-10 pt-6 pb-8">
        <div className="flex">
          <IdeaCard idea={session.idea} />
        </div>
      </div>

      {/* Center stage — agent cards centered like landing page */}
      <div className="flex-1 flex flex-col items-center px-6 sm:px-8 mt-8">
        {/* Completed agents */}
        {completedAgents.length > 0 && (
          <div className="w-full max-w-lg space-y-2 mb-6">
            {completedAgents.map((agent, i) => {
              const persona = personaMap[agent.personaId];
              if (!persona) return null;
              return (
                <CompletedAgentRow
                  key={agent.personaId}
                  persona={persona}
                  state={agent}
                  index={i}
                  isReplay={isReplay}
                />
              );
            })}
          </div>
        )}

        {/* Active agent — centered */}
        <AnimatePresence mode="wait">
          {activeAgent && personaMap[activeAgent.personaId] && (
            <motion.div
              key={activeAgent.personaId}
              className="w-full max-w-lg"
            >
              <AgentCard
                persona={personaMap[activeAgent.personaId]}
                state={activeAgent}
                onAnswer={onAnswer}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waiting indicator */}
        {phase === "agents" && !activeAgent && completedAgents.length > 0 && completedAgents.length < personas.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-8"
          >
            <LoadingPill text="Next specialist is stepping in..." />
          </motion.div>
        )}

        {/* Discussion */}
        {(phase === "discussion" || phase === "synthesis" || phase === "complete") &&
          discussionMsgs.length > 0 && (
            <div className="w-full max-w-lg mt-6">
              <DiscussionSection
                messages={discussionMsgs}
                personaMap={personaMap}
                isReplay={isReplay}
              />
            </div>
          )}

        {phase === "discussion" && discussionMsgs.length === 0 && (
          <div className="py-8">
            <LoadingPill text="Team is talking it out..." />
          </div>
        )}

        {phase === "synthesis" && !synthesis && (
          <div className="py-8">
            <LoadingPill text="Pulling it all together..." />
          </div>
        )}

        {/* Synthesis */}
        {synthesis && (
          <div className="w-full max-w-lg mt-6 mb-10">
            <SynthesisCard content={synthesis} />
          </div>
        )}

        {/* Error is now handled by toast in App.tsx */}

        <div ref={bottomRef} className="pb-20" />
      </div>
    </div>
  );
}

function LoadingPill({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/5 border border-accent/10">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-accent rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <span className="text-xs text-accent font-medium">{text}</span>
    </div>
  );
}
