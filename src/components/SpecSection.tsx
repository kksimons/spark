import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil, X, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { SpecSection as SpecSectionType } from "../types";
import { cn } from "@/lib/utils";

const SECTION_EMOJI: Record<string, string> = {
  gavel: "\u{2696}\u{FE0F}",
  users: "\u{1F465}",
  building: "\u{1F3E2}",
  route: "\u{1F6A9}",
  server: "\u{1F5A5}\u{FE0F}",
  shield: "\u{1F6E1}\u{FE0F}",
  palette: "\u{1F3A8}",
  "alert-triangle": "\u{26A0}\u{FE0F}",
  "dollar-sign": "\u{1F4B0}",
  "file-text": "\u{1F4C4}",
};

interface SpecSectionProps {
  section: SpecSectionType;
  isStakeholder?: boolean;
  onSave?: (id: string, content: string) => void;
  writing?: boolean;
  defaultCollapsed?: boolean;
}

export function SpecSection({ section, isStakeholder, onSave, writing, defaultCollapsed }: SpecSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(section.content);
  const [saved, setSaved] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(section.content);
  }, [section.content]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editing, draft]);

  const handleSave = () => {
    if (onSave) onSave(section.id, draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setDraft(section.content);
    setEditing(false);
  };

  const isSkeleton = section.status === "skeleton" && !section.content;
  const isWriting = writing || (section.status === "writing" && !section.content);
  const emoji = SECTION_EMOJI[section.icon] ?? SECTION_EMOJI["file-text"]!;
  const hasContent = !!section.content;

  const toggleCollapse = () => {
    if (!editing && hasContent) {
      setCollapsed((c) => !c);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: section.order * 0.04 }}
      className={cn(
        "group rounded-xl border bg-white transition-all relative overflow-hidden",
        isStakeholder && !isSkeleton
          ? "border-accent/25 shadow-[0_2px_24px_rgba(61,155,143,0.08)]"
          : "border-border/60",
        isWriting && "border-accent/30 shadow-[0_2px_20px_rgba(61,155,143,0.12)]",
        isSkeleton && "border-border/30"
      )}
      data-testid={`spec-section-${section.id}`}
    >
      {isWriting && (
        <motion.div
          className="absolute inset-x-0 bottom-0 h-[2px] bg-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, ease: "linear" }}
          style={{ transformOrigin: "left" }}
        />
      )}

      <div
        className={cn(
          "flex items-center justify-between px-4 sm:px-6 py-3 border-b",
          isStakeholder && !isSkeleton
            ? "border-accent/15 bg-accent/[0.03]"
            : "border-border/20",
          isSkeleton && "border-border/10",
          hasContent && !editing && "cursor-pointer select-none sm:cursor-default"
        )}
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center text-[13px] shrink-0",
              isSkeleton ? "bg-muted/50" : isStakeholder ? "bg-accent/10" : "bg-muted"
            )}
          >
            {emoji}
          </div>
          <div className="min-w-0">
            <h2
              className={cn(
                "text-[13px] sm:text-[14px] font-bold tracking-[-0.02em] leading-tight truncate",
                isSkeleton ? "text-muted-foreground/40" : isStakeholder ? "text-accent" : "text-foreground",
                isWriting && "text-accent"
              )}
            >
              {section.title}
            </h2>
            {isStakeholder && !isSkeleton && (
              <p className="text-[10px] text-accent/50 font-medium mt-0.5 tracking-wide hidden sm:block">
                Start here — your immediate action items
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isWriting && (
            <div className="flex gap-0.5 mr-1">
              {[0, 1, 2].map((dot) => (
                <motion.div
                  key={dot}
                  className="w-1.5 h-1.5 bg-accent rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.15 }}
                />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {saved && (
              <motion.span
                key="saved"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                className="text-[10px] text-accent font-medium mr-1"
              >
                Saved
              </motion.span>
            )}
          </AnimatePresence>

          {!isSkeleton && !isWriting && onSave && (
            <div className="hidden sm:flex items-center gap-1.5">
              {!editing ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-accent hover:bg-accent/5 transition-all opacity-0 group-hover:opacity-100"
                  title="Edit section"
                  data-testid={`spec-edit-${section.id}`}
                >
                  <Pencil className="w-3 h-3" />
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSave(); }}
                    className="w-7 h-7 rounded-md flex items-center justify-center bg-accent text-white hover:bg-accent/90 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          )}

          {hasContent && !isSkeleton && !editing && (
            <motion.div
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden w-6 h-6 flex items-center justify-center text-muted-foreground/50"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {(isSkeleton || isWriting || !collapsed || editing) && (
          <motion.div
            initial={false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-4 sm:py-5">
              {isSkeleton ? (
                <div className="space-y-2.5 py-1">
                  <SkeletonLine width="90%" />
                  <SkeletonLine width="100%" />
                  <SkeletonLine width="75%" />
                  <SkeletonLine width="85%" />
                </div>
              ) : editing ? (
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full min-h-[160px] resize-y bg-muted/30 rounded-lg px-3 py-2.5 text-[13px] leading-[1.7] text-foreground border border-accent/15 focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono"
                />
              ) : (
                <div
                  className={cn(
                    "spec-prose text-[13px] sm:text-[14px] leading-[1.7] text-foreground/85",
                    "prose prose-sm prose-neutral max-w-none",
                    "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
                    "[&_strong]:text-foreground [&_strong]:font-semibold",
                    "[&_h1]:text-[16px] [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-4",
                    "[&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-4",
                    "[&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5",
                    "[&_p]:mb-2.5 [&_p]:text-foreground/80",
                    "[&_ul]:space-y-1 [&_ul]:my-2",
                    "[&_ol]:space-y-1 [&_ol]:my-2",
                    "[&_li]:text-foreground/80 [&_li]:leading-[1.65]",
                    "[&_table]:w-full [&_table]:text-[12px]",
                    "[&_th]:text-left [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-foreground",
                    "[&_td]:px-2.5 [&_td]:py-1.5 [&_td]:border-t [&_td]:border-border/40 [&_td]:text-foreground/80",
                    "[&_tr]:border-b [&_tr]:border-border/20"
                  )}
                  data-testid={`spec-content-${section.id}`}
                >
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasContent && collapsed && (
        <div className="px-4 sm:px-6 pb-2 pt-0.5 sm:hidden">
          <p className="text-[11px] text-muted-foreground/50 truncate">
            {section.content.replace(/[#*_\-\n]+/g, " ").slice(0, 80)}...
          </p>
        </div>
      )}
    </motion.div>
  );
}

function SkeletonLine({ width }: { width: string }) {
  return (
    <div
      className="h-3 bg-muted/60 rounded animate-pulse-soft"
      style={{ width }}
    />
  );
}
