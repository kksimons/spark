import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Persona, PersonaState } from "../types";
import { cn } from "@/lib/utils";

interface DiscussionThreadProps {
  personas: Persona[];
  personaStates: Record<string, PersonaState>;
  currentRound: number;
}

const ROUND_LABELS: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Individual Assessments", subtitle: "Each specialist evaluates independently" },
  2: { title: "Cross-Department Discussion", subtitle: "Specialists respond to each other's insights" },
};

export function DiscussionThread({
  personas,
  personaStates,
  currentRound,
}: DiscussionThreadProps) {
  const rounds = [1, 2].filter((r) => r <= currentRound);

  return (
    <div className="space-y-10">
      {rounds.map((round) => {
        const roundMessages = personas
          .map((persona) => {
            const msg = personaStates[persona.id]?.messages?.find((m) => m.round === round);
            return msg ? { persona, content: msg.content } : null;
          })
          .filter(Boolean) as { persona: Persona; content: string }[];

        if (roundMessages.length === 0) return null;

        return (
          <motion.div
            key={round}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Round header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="h-px flex-1 bg-border" />
              <div className="text-center">
                <p className="text-[10px] font-semibold text-accent uppercase tracking-[0.15em]">
                  Round {round}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ROUND_LABELS[round]?.subtitle}
                </p>
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Messages */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {roundMessages.map(({ persona, content }, i) => (
                  <MessageCard
                    key={`${persona.id}-${round}`}
                    persona={persona}
                    content={content}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function MessageCard({
  persona,
  content,
  index,
}: {
  persona: Persona;
  content: string;
  index: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.45,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        <div className="w-9 h-9 rounded-lg overflow-hidden border border-border/60 shadow-sm">
          <img
            src={persona.avatar}
            alt={persona.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-sm font-semibold text-foreground">
            {persona.name}
          </span>
          <span className="text-[11px] text-accent font-medium">
            {persona.department}
          </span>
        </div>
        <div
          className={cn(
            "bg-white border border-border/60 rounded-xl rounded-tl-sm px-4 py-3",
            "text-sm leading-relaxed text-foreground/85",
            "shadow-[0_1px_8px_rgba(61,155,143,0.04)]",
            "prose prose-sm prose-neutral max-w-none",
            "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
            "[&_strong]:text-foreground [&_strong]:font-semibold",
            "[&_ul]:space-y-1 [&_ol]:space-y-1",
            "[&_li]:text-foreground/80"
          )}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
