import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SynthesisCardProps {
  content: string;
}

export function SynthesisCard({ content }: SynthesisCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Divider */}
      <div className="flex items-center gap-4 mb-5">
        <div className="h-px flex-1 bg-accent/20" />
        <div className="flex items-center gap-1.5 text-accent">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">
            Final Plan
          </span>
        </div>
        <div className="h-px flex-1 bg-accent/20" />
      </div>

      <div className="rounded-2xl overflow-hidden border-2 border-accent/20 shadow-[0_4px_32px_rgba(61,155,143,0.1)]">
        <div className="bg-accent px-5 py-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white tracking-wide">
            ENMAX Spark — Action Plan
          </span>
        </div>
        <div className="px-6 py-5 bg-white prose prose-sm prose-neutral max-w-none leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-foreground [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
