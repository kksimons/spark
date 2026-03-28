import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import type { Session } from "../types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  sessions: Session[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function CollapsibleSidebar({ open, onClose, sessions, activeId, onSelect }: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="hidden md:block border-r border-border/60 bg-white overflow-hidden shrink-0"
          >
            <SidebarContent sessions={sessions} activeId={activeId} onSelect={onSelect} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 md:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-white z-50 md:hidden shadow-xl"
            >
              <div className="flex items-center justify-between p-3 border-b border-border/60">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  History
                </span>
                <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <SidebarContent sessions={sessions} activeId={activeId} onSelect={onSelect} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  sessions,
  activeId,
  onSelect,
}: {
  sessions: Session[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="p-3 overflow-y-auto h-full">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2 hidden md:block">
        History
      </p>
      <div className="space-y-0.5">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={cn(
              "w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors",
              activeId === session.id
                ? "bg-accent/10 text-accent font-medium"
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
          </button>
        ))}
      </div>
    </div>
  );
}
