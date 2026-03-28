import { motion } from "framer-motion";
import type { Persona, DiscussionMsg } from "../types";

interface DiscussionSectionProps {
  messages: DiscussionMsg[];
  personaMap: Record<string, Persona>;
  isReplay: boolean;
}

export function DiscussionSection({
  messages,
  personaMap,
  isReplay,
}: DiscussionSectionProps) {
  return (
    <motion.div
      initial={isReplay ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Divider */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2">
          {/* Mini avatar row */}
          <div className="flex -space-x-1.5">
            {messages.slice(0, 5).map((msg) => {
              const p = personaMap[msg.personaId];
              if (!p) return null;
              return (
                <div
                  key={msg.personaId}
                  className="w-5 h-5 rounded-full overflow-hidden border-2 border-white"
                >
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              );
            })}
          </div>
          <span className="text-[10px] font-semibold text-accent uppercase tracking-widest">
            Team Discussion
          </span>
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Messages */}
      <div className="space-y-2.5">
        {messages.map((msg, i) => {
          const persona = personaMap[msg.personaId];
          if (!persona) return null;

          return (
            <motion.div
              key={`${msg.personaId}-disc`}
              initial={isReplay ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: isReplay ? 0 : i * 0.12,
                duration: 0.35,
                ease: [0.23, 1, 0.32, 1],
              }}
              className="flex gap-2.5"
            >
              <div className="w-7 h-7 rounded-md overflow-hidden border border-border/60 shrink-0 mt-0.5">
                <img
                  src={persona.avatar}
                  alt={persona.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-[12px] font-semibold text-foreground tracking-[-0.01em]">
                    {persona.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground tracking-wide">
                    {persona.department}
                  </span>
                </div>
                <div className="bg-white border border-border/60 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-[12px] leading-[1.65] text-foreground/75 shadow-sm tracking-[-0.006em]">
                  {msg.content}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
