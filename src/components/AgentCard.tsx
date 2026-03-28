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
      className="flex flex-col items-center gap-6 w-full max-w-xl"
    >
      {/* The card itself */}
      <div className="perspective w-full">
        <AnimatePresence mode="wait" initial={false}>
          {!flipped ? (
            /* ── Badge front — narrow, centered ── */
            <motion.div
              key="front"
              initial={{ rotateY: 0 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeIn" }}
              className="flex justify-center"
            >
              <div className="w-56">
                <BadgeFront persona={persona} isThinking={state.phase === "thinking"} />
              </div>
            </motion.div>
          ) : (
            /* ── Assessment back — full width ── */
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
    <div className="bg-white rounded-xl border border-border/60 shadow-[0_2px_24px_rgba(61,155,143,0.08)]">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 sm:px-14 py-5 sm:py-6 border-b border-border/30">
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/60 shrink-0">
          <img
            src={persona.avatar}
            alt={persona.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-foreground leading-none tracking-[-0.01em]">
            {persona.name}
          </p>
          <p className="text-[11px] text-accent font-medium mt-1.5 tracking-wide">
            {persona.department}
          </p>
        </div>
      </div>

      {/* Assessment content */}
      <div className="px-5 sm:px-20 py-6 sm:py-12 max-h-[40rem] overflow-y-auto text-[14px] sm:text-[15px] leading-[1.75] text-foreground/85 prose prose-sm prose-neutral max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:space-y-2 [&_ol]:space-y-2 [&_li]:text-foreground/80 [&_h1]:text-[18px] sm:text-[20px] [&_h1]:font-bold [&_h2]:text-[16px] sm:text-[17px] [&_h2]:font-bold [&_h3]:text-[14px] sm:text-[15px] [&_h3]:font-semibold [&_p]:mb-4 [&_ul]:my-3 [&_ol]:my-3">
        <ReactMarkdown>{state.assessment ?? ""}</ReactMarkdown>
      </div>

      {/* Followup (if user answered a question) */}
      {state.followup && (
        <div className="mx-5 sm:mx-14 mb-6 sm:mb-8 px-5 sm:px-6 py-4 sm:py-5 bg-accent/5 border border-accent/10 rounded-lg">
          <p className="text-[10px] font-bold text-accent uppercase tracking-[0.15em] mb-2">
            Updated take
          </p>
          <p className="text-[13px] text-foreground/70 leading-[1.75]">
            {state.followup}
          </p>
        </div>
      )}
    </div>
  );
}
