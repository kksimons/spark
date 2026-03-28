import { motion } from "framer-motion";
import type { Persona, PersonaState } from "../types";
import { cn } from "@/lib/utils";

interface PersonaCardProps {
  persona: Persona;
  state: PersonaState;
  index: number;
}

export function PersonaCard({ persona, state, index }: PersonaCardProps) {
  const isActive = state.status === "thinking" || state.status === "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.12,
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={cn(
        "relative w-48 rounded-2xl overflow-hidden bg-white border transition-all duration-500",
        isActive
          ? "border-accent/30 shadow-[0_4px_24px_rgba(61,155,143,0.18)]"
          : "border-border/60 shadow-sm"
      )}
    >
      {/* Lanyard clip */}
      <div className="flex justify-center">
        <div className="w-8 h-2.5 bg-foreground/80 rounded-b-md" />
      </div>

      {/* Name strip */}
      <div className="bg-foreground mx-3 mt-1.5 rounded-md px-3 py-1.5">
        <p className="text-[11px] font-bold tracking-widest uppercase text-white text-center truncate">
          {persona.name}
        </p>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mt-3 px-4">
        <div
          className={cn(
            "w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-500",
            state.status === "thinking"
              ? "border-accent/50 shadow-[0_0_16px_rgba(61,155,143,0.3)]"
              : isActive
                ? "border-accent/20"
                : "border-border/40"
          )}
        >
          <img
            src={persona.avatar}
            alt={persona.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Info */}
      <div className="px-3 pt-2.5 pb-3 text-center">
        <p className="text-xs font-semibold text-foreground">{persona.role}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {persona.department}
        </p>

        {/* Status */}
        <div className="mt-2.5 h-5 flex items-center justify-center">
          {state.status === "thinking" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1"
            >
              {[0, 1, 2].map((dot) => (
                <motion.div
                  key={dot}
                  className="w-1.5 h-1.5 bg-accent rounded-full"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: dot * 0.2 }}
                />
              ))}
            </motion.div>
          )}
          {state.status === "done" && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="px-2.5 py-0.5 bg-accent/10 text-accent text-[10px] font-semibold rounded-full"
            >
              {state.messages.length} {state.messages.length === 1 ? "response" : "responses"}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
