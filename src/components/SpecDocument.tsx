import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";
import type { SpecSection as SpecSectionType } from "../types";
import { SpecSection } from "./SpecSection";
import { SpecToolbar } from "./SpecToolbar";

interface SpecDocumentProps {
  sessionId: string;
  idea: string;
  sections: SpecSectionType[];
  version: number;
  githubUrl?: string;
  completed?: boolean;
}

export function SpecDocument({
  sessionId,
  idea,
  sections,
  version,
  githubUrl,
  completed,
}: SpecDocumentProps) {
  const [localSections, setLocalSections] = useState<SpecSectionType[]>(sections);

  const mergedSections = useMemo(() => {
    return localSections.map((local, i) => {
      const incoming = sections[i];
      if (incoming && incoming.content && !local.content) {
        return incoming;
      }
      if (incoming && incoming.content && local.content !== incoming.content) {
        return { ...local, content: incoming.content, status: incoming.status };
      }
      return local;
    });
  }, [localSections, sections]);

  const hasChanges = localSections !== sections;

  const handleSave = useCallback(
    async (sectionId: string, content: string) => {
      setLocalSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, content } : s))
      );

      if (!completed) return;

      const fullMarkdown = mergedSections
        .map((s) => `# ${s.title}\n${s.id === sectionId ? content : s.content}`)
        .join("\n\n");

      try {
        await fetch(`/api/sessions/${sessionId}/spec`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: fullMarkdown }),
        });
      } catch {
        // silent
      }
    },
    [mergedSections, sessionId, completed]
  );

  const stakeholderIdx = mergedSections.findIndex((s) =>
    s.title.toLowerCase().includes("stakeholder")
  );

  return (
    <div className="flex flex-col h-full" data-testid="spec-document">
      {completed && (
        <SpecToolbar
          sessionId={sessionId}
          version={version}
          githubUrl={githubUrl}
          hasChanges={hasChanges}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 py-4">
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/8 mb-3">
              {completed ? (
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-accent" />
              )}
              <span className="text-[11px] font-semibold text-accent tracking-wide uppercase">
                {completed ? "Project Specification" : "Building Spec..."}
              </span>
            </div>
            <h1 className="text-[18px] sm:text-[22px] font-bold tracking-[-0.03em] text-foreground mb-2">
              ENMAX Spark Spec
            </h1>
            <p className="text-[13px] text-muted-foreground leading-[1.5] max-w-md mx-auto line-clamp-2">
              {idea}
            </p>
            {!completed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-3 flex items-center justify-center gap-2 text-[11px] text-accent/60"
              >
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((dot) => (
                    <motion.div
                      key={dot}
                      className="w-1 h-1 bg-accent rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.2 }}
                    />
                  ))}
                </div>
                Agents are working on this
              </motion.div>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {stakeholderIdx >= 0 && (
                <SpecSection
                  key={mergedSections[stakeholderIdx].id}
                  section={mergedSections[stakeholderIdx]}
                  isStakeholder
                  onSave={completed ? handleSave : undefined}
                  writing={
                    mergedSections[stakeholderIdx].status === "writing" &&
                    !mergedSections[stakeholderIdx].content
                  }
                />
              )}

              {mergedSections.map(
                (section, i) =>
                  i !== stakeholderIdx && (
                    <SpecSection
                      key={section.id}
                      section={section}
                      onSave={completed ? handleSave : undefined}
                      writing={
                        section.status === "writing" && !section.content
                      }
                    />
                  )
              )}
            </AnimatePresence>
          </div>

          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}
