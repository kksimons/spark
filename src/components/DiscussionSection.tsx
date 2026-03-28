import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
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
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {messages.slice(0, 5).map((msg) => {
              const p = personaMap[msg.personaId];
              if (!p) return null;
              return (
                <div
                  key={msg.personaId}
                  className="w-5 h-5 rounded-full overflow-hidden border-2 border-white"
                >
                  <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
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
      <div className="space-y-5">
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
              className="bg-white border border-border/60 rounded-xl shadow-sm"
            >
              {/* Agent header */}
              <div className="flex items-center gap-3 px-5 sm:px-10 pt-5 sm:pt-6 pb-3 sm:pb-4 border-b border-border/30">
                <div className="w-9 h-9 rounded-lg overflow-hidden border border-border/60 shrink-0">
                  <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[14px] font-semibold text-foreground tracking-[-0.01em]">
                    {persona.name}
                  </span>
                  <span className="text-[11px] text-accent font-medium tracking-wide ml-2.5">
                    {persona.department}
                  </span>
                </div>
              </div>
              {/* Message body */}
              <div className="px-5 sm:px-16 py-6 sm:py-10 text-[14px] sm:text-[15px] leading-[1.75] text-foreground/85 prose prose-sm prose-neutral max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-foreground [&_strong]:font-semibold [&_p]:mb-3 [&_ul]:space-y-2 [&_ul]:my-3 [&_ol]:space-y-2 [&_ol]:my-3 [&_li]:text-foreground/80 [&_h1]:text-[16px] sm:text-[18px] [&_h1]:font-bold [&_h2]:text-[15px] sm:text-[16px] [&_h2]:font-bold [&_h3]:text-[13px] sm:text-[14px] [&_h3]:font-semibold">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
