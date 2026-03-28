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
    state.assessment?.replace(/[#*_\-\n]+/g, " ").slice(0, 120) ?? "";

  return (
    <motion.div
      initial={isReplay ? false : { opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: isReplay ? 0 : index * 0.06, duration: 0.35 }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          "w-full text-left bg-white border rounded-xl px-4 py-3 transition-all hover:shadow-sm",
          expanded
            ? "border-accent/20 shadow-[0_2px_16px_rgba(61,155,143,0.08)]"
            : "border-border/60"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-border/60 shrink-0">
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
              <p className="text-xs text-muted-foreground truncate mt-0.5">
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
            <div className="bg-white border border-t-0 border-border/60 rounded-b-xl -mt-2 pt-4 px-4 pb-3 ml-11">
              <div className="text-[13px] leading-[1.7] text-foreground/80 prose prose-sm prose-neutral [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-foreground [&_strong]:font-semibold [&_p]:mb-2">
                <ReactMarkdown>{state.assessment ?? ""}</ReactMarkdown>
              </div>
              {state.followup && (
                <div className="mt-3 px-3 py-2 bg-accent/5 border border-accent/10 rounded-lg">
                  <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-1">
                    Updated take
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed">
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
