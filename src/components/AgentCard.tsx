import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Persona, AgentState } from "../types";
import { QuestionBubble } from "./QuestionBubble";

interface AgentCardProps {
  persona: Persona;
  state: AgentState;
  onAnswer: (answer: string) => void;
}

export function AgentCard({ persona, state, onAnswer }: AgentCardProps) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Flip when we get a response
  useEffect(() => {
    if (state.phase === "responded" || state.phase === "questioning") {
      const timer = setTimeout(() => setFlipped(true), 600);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  // Scroll into view on enter
  useEffect(() => {
    if (state.phase === "entering") {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  }, [state.phase]);

  const showQuestion =
    state.question &&
    (state.phase === "questioning" || state.phase === "waiting" || state.phase === "followup");

  return (
    <motion.div
      ref={cardRef}
      initial={{ y: -280, opacity: 0, rotate: -6, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
      exit={{ y: 30, opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
      transition={{
        type: "spring",
        stiffness: 160,
        damping: 16,
        mass: 1.4,
      }}
      className="flex flex-col items-center gap-4"
    >
      {/* The card itself */}
      <div className="perspective w-full max-w-xs">
        <AnimatePresence mode="wait" initial={false}>
          {!flipped ? (
            /* ── Badge front ── */
            <motion.div
              key="front"
              initial={{ rotateY: 0 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeIn" }}
              className="w-full"
            >
              <BadgeFront persona={persona} isThinking={state.phase === "thinking"} />
            </motion.div>
          ) : (
            /* ── Assessment back ── */
            <motion.div
              key="back"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full"
            >
              <AssessmentCard persona={persona} state={state} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Question bubble */}
      <AnimatePresence>
        {showQuestion && (
          <QuestionBubble
            persona={persona}
            question={state.question!}
            userAnswer={state.userAnswer}
            followup={state.followup}
            isWaiting={state.phase === "waiting" || state.phase === "followup"}
            onAnswer={onAnswer}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Badge front (ID card) ── */
function BadgeFront({
  persona,
  isThinking,
}: {
  persona: Persona;
  isThinking: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-[0_4px_24px_rgba(61,155,143,0.1)] overflow-hidden">
      {/* Lanyard clip */}
      <div className="flex justify-center">
        <div className="w-10 h-3 bg-foreground/80 rounded-b-lg" />
      </div>

      {/* Name strip */}
      <div className="bg-foreground mx-4 mt-2 rounded-lg px-4 py-2">
        <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-white text-center">
          {persona.name}
        </p>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mt-4 px-4">
        <motion.div
          animate={
            isThinking
              ? { boxShadow: ["0 0 0 0 rgba(61,155,143,0)", "0 0 20px 4px rgba(61,155,143,0.3)", "0 0 0 0 rgba(61,155,143,0)"] }
              : {}
          }
          transition={isThinking ? { duration: 1.5, repeat: Infinity } : {}}
          className="w-28 h-28 rounded-xl overflow-hidden border-2 border-border/40"
        >
          <img
            src={persona.avatar}
            alt={persona.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>

      {/* Info */}
      <div className="text-center px-4 pt-3 pb-2">
        <p className="text-[13px] font-semibold tracking-[-0.01em] text-foreground">{persona.role}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 tracking-wide">
          {persona.department}
        </p>
      </div>

      {/* Status area */}
      <div className="h-10 flex items-center justify-center">
        {isThinking && (
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((dot) => (
              <motion.div
                key={dot}
                className="w-2 h-2 bg-accent rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: dot * 0.15,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom strip */}
      <div className="bg-foreground mx-4 mb-4 rounded-lg px-3 py-1.5 text-center">
        <span className="text-[9px] font-semibold text-white/60 tracking-[0.2em] uppercase">
          ENMAX · {persona.department}
        </span>
      </div>
    </div>
  );
}

/* ── Assessment card (flipped side) ── */
function AssessmentCard({
  persona,
  state,
}: {
  persona: Persona;
  state: AgentState;
}) {
  return (
    <div className="bg-white rounded-2xl border border-accent/20 shadow-[0_4px_32px_rgba(61,155,143,0.12)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-border/60 shrink-0">
          <img
            src={persona.avatar}
            alt={persona.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground leading-none tracking-[-0.01em]">
            {persona.name}
          </p>
          <p className="text-[11px] text-accent font-medium mt-1 tracking-wide">
            {persona.department}
          </p>
        </div>
      </div>

      {/* Assessment content */}
      <div className="px-4 py-3 max-h-80 overflow-y-auto text-[13px] leading-[1.7] text-foreground/80 prose prose-sm prose-neutral [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:space-y-0.5 [&_ol]:space-y-0.5 [&_li]:text-foreground/75 [&_h1]:text-sm [&_h2]:text-[13px] [&_h3]:text-xs [&_p]:mb-2">
        <ReactMarkdown>{state.assessment ?? ""}</ReactMarkdown>
      </div>

      {/* Followup (if user answered a question) */}
      {state.followup && (
        <div className="mx-4 mb-3 px-3 py-2 bg-accent/5 border border-accent/10 rounded-lg">
          <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-1">
            Updated take
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {state.followup}
          </p>
        </div>
      )}
    </div>
  );
}
