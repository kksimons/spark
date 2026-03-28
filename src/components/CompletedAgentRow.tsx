import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Persona, AgentState } from "../types";
import { cn } from "@/lib/utils";

interface CompletedAgentRowProps {
  persona: Persona;
  state: AgentState;
  index: number;
  isReplay?: boolean;
}

export function CompletedAgentRow({
  persona,
  state,
  index,
  isReplay,
}: CompletedAgentRowProps) {
  const [expanded, setExpanded] = useState(false);
  const preview =
    state.assessment?.replace(/[#*_\-\n]+/g, " ").slice(0, 100) ?? "";

  return (
    <motion.div
      initial={isReplay ? false : { opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: isReplay ? 0 : index * 0.06, duration: 0.35 }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          "w-full text-left bg-white border rounded-xl px-6 py-4 transition-all hover:shadow-sm",
          expanded
            ? "border-accent/20 shadow-[0_2px_16px_rgba(61,155,143,0.08)]"
            : "border-border/60"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-border/60 shrink-0">
            <img
              src={persona.avatar}
              alt={persona.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">
                {persona.name}
              </span>
              <span className="text-[10px] text-accent font-semibold tracking-wide">
                {persona.department}
              </span>
            </div>
            {!expanded && (
              <p className="text-[12px] text-muted-foreground truncate mt-1">
                {preview}...
              </p>
            )}
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform shrink-0",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-t-0 border-border/60 rounded-b-xl -mt-3 px-5 sm:px-16 py-6 sm:py-10">
              <div className="max-h-[32rem] overflow-y-auto text-[13px] sm:text-[14px] leading-[1.75] text-foreground/85 prose prose-sm prose-neutral max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-foreground [&_strong]:font-semibold [&_p]:mb-3 [&_ul]:space-y-2 [&_ul]:my-3 [&_ol]:space-y-2 [&_ol]:my-3 [&_li]:text-foreground/80 [&_h1]:text-[16px] sm:text-[18px] [&_h1]:font-bold [&_h2]:text-[15px] sm:text-[16px] [&_h2]:font-bold [&_h3]:text-[13px] sm:text-[14px] [&_h3]:font-semibold">
                <ReactMarkdown>{state.assessment ?? ""}</ReactMarkdown>
              </div>
              {state.followup && (
                <div className="mt-5 px-5 py-4 bg-accent/5 border border-accent/10 rounded-lg">
                  <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-1.5">
                    Updated take
                  </p>
                  <p className="text-[13px] text-foreground/70 leading-[1.75]">
                    {state.followup}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
