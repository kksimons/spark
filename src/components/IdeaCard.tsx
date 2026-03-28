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
        className="inline-block text-left shrink-0 bg-white border border-border/60 shadow-lg hover:shadow-xl transition-shadow cursor-pointer max-w-xl group rounded-2xl"
      >
        <AnimatePresence mode="wait" initial={false}>
          {collapsed ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center p-3.5 bg-white rounded-full shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                <Lightbulb className="w-5 h-5 text-accent" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-4 px-8 py-6 rounded-2xl"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
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
