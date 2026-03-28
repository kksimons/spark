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

  // Auto-scroll on new discussion messages or synthesis
  useEffect(() => {
    if (discussionMsgs.length > 0 || synthesis) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 200);
    }
  }, [discussionMsgs.length, synthesis]);

  return (
    <div className="max-w-2xl mx-auto px-6 sm:px-10 py-8 pb-24 space-y-5">
      {/* Idea */}
      <IdeaCard idea={session.idea} />

      {/* Completed agents (collapsed rows) */}
      {completedAgents.length > 0 && (
        <div className="space-y-2">
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

      {/* Active agent (the dramatic card) */}
      <AnimatePresence mode="wait">
        {activeAgent && personaMap[activeAgent.personaId] && (
          <div key={activeAgent.personaId} className="flex justify-center py-4">
            <AgentCard
              persona={personaMap[activeAgent.personaId]}
              state={activeAgent}
              onAnswer={onAnswer}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Waiting indicator between agents */}
      {phase === "agents" && !activeAgent && completedAgents.length > 0 && completedAgents.length < personas.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex justify-center py-6"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/10">
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
            <span className="text-xs text-accent font-medium">
              Next specialist is stepping in...
            </span>
          </div>
        </motion.div>
      )}

      {/* Cross-department discussion */}
      {(phase === "discussion" || phase === "synthesis" || phase === "complete") &&
        discussionMsgs.length > 0 && (
          <DiscussionSection
            messages={discussionMsgs}
            personaMap={personaMap}
            isReplay={isReplay}
          />
        )}

      {/* Discussion loading */}
      {phase === "discussion" && discussionMsgs.length === 0 && (
        <LoadingPill text="Team is talking it out..." />
      )}

      {/* Synthesis loading */}
      {phase === "synthesis" && !synthesis && (
        <LoadingPill text="Pulling it all together..." />
      )}

      {/* Synthesis */}
      {synthesis && <SynthesisCard content={synthesis} />}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center"
        >
          {error}
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function LoadingPill({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center py-4"
    >
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/10">
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
    </motion.div>
  );
}
