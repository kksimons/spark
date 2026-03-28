import { motion, AnimatePresence } from "framer-motion";
import type { Persona, PersonaState, Session } from "../types";
import { PersonaCard } from "./PersonaCard";
import { DiscussionThread } from "./DiscussionThread";
import { SynthesisCard } from "./SynthesisCard";

interface EvaluationViewProps {
  session: Session;
  personas: Persona[];
  personaStates: Record<string, PersonaState>;
  currentRound: number;
  synthesis: string | null;
  isEvaluating: boolean;
  error: string | null;
}

export function EvaluationView({
  session,
  personas,
  personaStates,
  currentRound,
  synthesis,
  isEvaluating,
  error,
}: EvaluationViewProps) {
  const hasAnyActivity = currentRound >= 1;
  const activePersonas = personas.filter(
    (p) => personaStates[p.id]?.status !== "idle"
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20 space-y-10">
      {/* Idea header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-2">
          Evaluating idea
        </p>
        <h2 className="text-xl font-medium tracking-tight text-foreground max-w-2xl mx-auto leading-relaxed">
          "{session.idea}"
        </h2>
      </motion.div>

      {/* Persona cards — only show when there's activity */}
      <AnimatePresence>
        {hasAnyActivity && activePersonas.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center gap-3 flex-wrap"
          >
            {activePersonas.map((persona, i) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                state={personaStates[persona.id]}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discussion threads */}
      {currentRound >= 1 && (
        <DiscussionThread
          personas={personas}
          personaStates={personaStates}
          currentRound={currentRound}
        />
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

      {/* Loading state */}
      {isEvaluating && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/10">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-accent rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span className="text-xs text-accent font-medium">
              {currentRound === 1 && "Individual assessments in progress"}
              {currentRound === 2 && "Cross-department discussion"}
              {currentRound === 3 && "Synthesizing final plan"}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
