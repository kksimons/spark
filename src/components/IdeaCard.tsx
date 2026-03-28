import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";

export function IdeaCard({ idea }: { idea: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full text-left bg-white border border-border/60 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
        <AnimatePresence mode="wait" initial={false}>
          {collapsed ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-5 py-3"
            >
              <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                <Lightbulb className="w-3.5 h-3.5 text-accent" />
              </div>
              <p className="text-[13px] text-muted-foreground truncate">
                {idea}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-4 px-8 py-6"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-2">
                  The Idea
                </p>
                <p className="text-[15px] text-foreground leading-[1.7]">
                  {idea}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}
