import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  GitBranch,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface SpecToolbarProps {
  sessionId: string;
  version: number;
  githubUrl?: string;
  hasChanges: boolean;
}

export function SpecToolbar({
  sessionId,
  version,
  githubUrl,
  hasChanges,
}: SpecToolbarProps) {
  const [pushing, setPushing] = useState(false);

  const handleDownload = () => {
    window.open(`/api/sessions/${sessionId}/spec/download`, "_blank");
  };

  const handleGitHubPush = async () => {
    setPushing(true);
    try {
      toast.info("GitHub integration coming soon — download the spec and upload manually for now.");
    } finally {
      setPushing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 bg-white/80 backdrop-blur-xl border-b border-border/40"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-[11px] font-medium text-muted-foreground">
            <Clock className="w-3 h-3" />
            v{version}
          </div>
          {hasChanges && (
            <span className="text-[11px] text-accent font-medium animate-pulse-soft">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-border/60 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
            <span className="sm:hidden">.md</span>
          </button>

          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-border/60 rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View on GitHub
            </a>
          ) : (
            <button
              onClick={handleGitHubPush}
              disabled={pushing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-border/60 rounded-lg hover:bg-muted transition-colors text-foreground disabled:opacity-50"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Push to GitHub</span>
              <span className="sm:hidden">GitHub</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
