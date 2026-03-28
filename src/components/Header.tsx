import { Zap, Plus } from "lucide-react";

interface HeaderProps {
  onNewSession: () => void;
  showNew: boolean;
}

export function Header({ onNewSession, showNew }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border/60 flex items-center justify-between px-6 bg-white shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center shadow-sm">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          ENMAX Spark
        </span>
      </div>

      {showNew && (
        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors"
        >
          <Plus className="w-3 h-3" />
          New
        </button>
      )}
    </header>
  );
}
