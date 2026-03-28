import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

export function IdeaCard({ idea }: { idea: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-border/60 rounded-2xl px-5 py-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-1.5">
            The Idea
          </p>
          <p className="text-[14px] text-foreground leading-[1.65] tracking-[-0.01em]">{idea}</p>
        </div>
      </div>
    </motion.div>
  );
}
