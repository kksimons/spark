import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import type { Session } from "../types";
import { cn } from "@/lib/utils";

interface SessionSidebarProps {
  sessions: Session[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function SessionSidebar({ sessions, activeId, onSelect }: SessionSidebarProps) {
  return (
    <aside className="w-56 border-r border-border/60 bg-white overflow-y-auto shrink-0 hidden md:block">
      <div className="p-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] px-2 mb-2">
          History
        </p>
        <div className="space-y-0.5">
          {sessions.map((session) => (
            <motion.button
              key={session.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onSelect(session.id)}
              className={cn(
                "w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors",
                activeId === session.id
                  ? "bg-accent/10 text-accent"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <div className="flex items-start gap-1.5">
                <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="line-clamp-2 leading-snug">
                  {session.idea.slice(0, 60)}
                  {session.idea.length > 60 ? "..." : ""}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </aside>
  );
}
