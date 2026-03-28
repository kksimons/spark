import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function SynthesisCard({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-accent/20" />
        <div className="flex items-center gap-1.5 text-accent">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            Action Plan
          </span>
        </div>
        <div className="h-px flex-1 bg-accent/20" />
      </div>

      <div className="rounded-xl overflow-hidden border border-accent/25 shadow-[0_4px_40px_rgba(61,155,143,0.1)]">
        <div className="bg-accent px-5 sm:px-8 py-3 sm:py-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-[12px] sm:text-[13px] font-semibold text-white tracking-wide">
            ENMAX Spark — Action Plan
          </span>
        </div>
        <div className="max-h-[50rem] overflow-y-auto px-5 sm:px-16 py-6 sm:py-10 bg-white text-[14px] sm:text-[15px] leading-[1.75] prose prose-sm prose-neutral max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-foreground [&_strong]:font-semibold [&_h1]:text-[20px] sm:text-[22px] [&_h1]:font-bold [&_h1]:tracking-[-0.02em] [&_h1]:mb-4 [&_h1]:mt-8 [&_h2]:text-[17px] sm:text-[18px] [&_h2]:font-bold [&_h2]:tracking-[-0.01em] [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-[14px] sm:text-[15px] [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:space-y-2 [&_ul]:my-3 [&_ol]:space-y-2 [&_ol]:my-3 [&_p]:mb-4 [&_p]:text-foreground/80 [&_li]:text-foreground/80 [&_li]:leading-[1.7]">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
