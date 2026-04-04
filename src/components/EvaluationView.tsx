import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Persona, AgentState, DiscussionMsg, Session, SpecSection } from "../types";
import { IdeaCard } from "./IdeaCard";
import { AgentCard } from "./AgentCard";
import { CompletedAgentRow } from "./CompletedAgentRow";
import { DiscussionSection } from "./DiscussionSection";
import { SynthesisCard } from "./SynthesisCard";
import { SpecDocument } from "./SpecDocument";
import { FileText, X, Sparkles } from "lucide-react";

interface EvaluationViewProps {
  session: Session;
  personas: Persona[];
  personaMap: Record<string, Persona>;
  completedAgents: AgentState[];
  activeAgent: AgentState | null;
  discussionMsgs: DiscussionMsg[];
  synthesis: string | null;
  specSections: SpecSection[];
  phase: "idle" | "agents" | "discussion" | "synthesis" | "complete";
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
  specSections,
  phase,
  isReplay,
  onAnswer,
}: EvaluationViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [specOpen, setSpecOpen] = useState(false);

  const isComplete = phase === "complete" && !!synthesis;
  const hasSpecSections = specSections.length > 0;

  useEffect(() => {
    if (isComplete && !specOpen) {
      const timer = setTimeout(() => setSpecOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isComplete, specOpen]);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 1200);
  }, [discussionMsgs.length, synthesis, activeAgent?.phase]);

  const filledCount = specSections.filter((s) => s.content).length;

  return (
    <>
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="px-4 sm:px-10 pt-6 pb-6 sm:pb-8">
          <IdeaCard idea={session.idea} />
        </div>

        <div className="flex-1 flex flex-col items-center px-4 sm:px-8 mt-4 sm:mt-8">
          {completedAgents.length > 0 && (
            <div className="w-full max-w-3xl space-y-3 mb-8">
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

          <AnimatePresence mode="wait">
            {activeAgent && personaMap[activeAgent.personaId] && (
              <motion.div
                key={activeAgent.personaId}
                className="w-full max-w-3xl"
              >
                <AgentCard
                  persona={personaMap[activeAgent.personaId]}
                  state={activeAgent}
                  onAnswer={onAnswer}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {phase === "agents" && !activeAgent && completedAgents.length > 0 && completedAgents.length < personas.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8"
            >
              <LoadingPill text="Next specialist stepping in..." />
            </motion.div>
          )}

          {(phase === "discussion" || phase === "synthesis" || phase === "complete") &&
            discussionMsgs.length > 0 && (
              <div className="w-full max-w-3xl mt-10">
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

          {synthesis && (
            <div className="w-full max-w-3xl mt-10 mb-16">
              <SynthesisCard content={synthesis} />
            </div>
          )}

          <div ref={bottomRef} className="h-48 sm:h-20" />
        </div>
      </div>

      {hasSpecSections && (
        <FloatingSpecButton
          filledCount={filledCount}
          totalCount={specSections.length}
          onClick={() => setSpecOpen((o) => !o)}
          isOpen={specOpen}
        />
      )}

      <AnimatePresence>
        {specOpen && hasSpecSections && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setSpecOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] md:w-[600px] lg:w-[680px] bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <span className="text-[13px] font-semibold text-foreground">
                    {isComplete ? "Specification" : "Building Spec..."}
                  </span>
                  {!isComplete && (
                    <span className="text-[11px] text-accent/60 font-medium">
                      {filledCount}/{specSections.length} sections
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSpecOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SpecDocument
                  sessionId={session.id}
                  idea={session.idea}
                  sections={specSections}
                  version={1}
                  completed={isComplete}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function FloatingSpecButton({
  filledCount,
  totalCount,
  onClick,
  isOpen,
}: {
  filledCount: number;
  totalCount: number;
  onClick: () => void;
  isOpen: boolean;
}) {
  const progress = totalCount > 0 ? filledCount / totalCount : 0;
  const isComplete = filledCount === totalCount && totalCount > 0;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.5 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 pl-4 pr-5 py-3 bg-white border border-border/60 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.16)] transition-shadow"
      data-testid="spec-fab"
    >
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-muted"
          />
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray={`${progress * 2 * Math.PI * 13} ${2 * Math.PI * 13}`}
            strokeLinecap="round"
            className={isComplete ? "text-accent" : "text-accent/70"}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isComplete ? (
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-accent" />
          )}
        </div>
      </div>
      <div className="text-left">
        <p className="text-[12px] font-semibold text-foreground leading-none">
          {isComplete ? "View Spec" : "Spec"}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {isComplete ? "Ready to edit" : `${filledCount}/${totalCount} sections`}
        </p>
      </div>
      {!isOpen && filledCount < totalCount && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
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
