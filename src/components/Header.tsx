import { Zap, PanelLeft } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  hasSessions: boolean;
}

export function Header({ onToggleSidebar, hasSessions }: HeaderProps) {
  return (
    <header className="h-14 sm:h-16 border-b border-border/60 flex items-center justify-between px-4 sm:px-14 bg-white shrink-0 z-30">
      <div className="flex items-center gap-3">
        {hasSessions && (
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-[14px] font-bold tracking-[-0.02em] text-foreground">
            ENMAX Spark
          </span>
        </div>
      </div>

      {/* {showNew && ( */}
      {/*   <button */}
      {/*     onClick={onNewSession} */}
      {/*     className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold tracking-wide border border-border rounded-md hover:bg-muted transition-colors" */}
      {/*   > */}
      {/*     <Plus className="w-3 h-3" /> */}
      {/*     New Spark */}
      {/*   </button> */}
      {/* )} */}
    </header>
  );
}
