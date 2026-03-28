import { useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface LandingInputProps {
  onSubmit: (idea: string) => void;
  disabled?: boolean;
}

const PERSONAS = [
  { name: "Dayee", dept: "Security", avatar: "/dayee.png", greeting: "Hey! I'll keep it secure." },
  { name: "Nathan", dept: "Digital", avatar: "/nathan.png", greeting: "Hi! I'll sort the infra." },
  { name: "Dana", dept: "Architecture", avatar: "/dana.png", greeting: "Hello! Let's see what fits." },
  { name: "Lalindra", dept: "Design", avatar: "/lalindra.png", greeting: "Hey! I'll make it shine." },
  { name: "Kyle", dept: "Engineering", avatar: "/kyle.png", greeting: "Yo! Let's build this." },
];

export function LandingInput({ onSubmit, disabled }: LandingInputProps) {
  const [value, setValue] = useState("");
  const [tappedId, setTappedId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTap = (name: string) => {
    setTappedId((prev) => (prev === name ? null : name));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] px-6 sm:px-10 pt-8">
      {/* Hero text — centered */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full text-center mb-10"
      >
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent/8 text-accent text-[11px] font-semibold tracking-[0.12em] uppercase mb-7">
          <Zap className="w-3 h-3" />
          Spark an Idea
        </div>
        <h2 className="text-[2.25rem] sm:text-[3rem] font-bold tracking-[-0.04em] text-foreground leading-[1.05] mb-5">
          What are you thinking?
        </h2>
        <p className="text-muted-foreground text-[15px] sm:text-[16px] leading-[1.65] mx-auto text-center mb-0">
          Share a product idea, AI use case, or app concept.<br />Our team will light it up.
        </p>
      </motion.div>

      <div className="h-10" />

      {/* Persona preview with hover/tap animations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex justify-center gap-5 sm:gap-6"
      >
        {PERSONAS.map((p, i) => {
          const isTapped = tappedId === p.name;
          return (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: isTapped ? -6 : 0 }}
              transition={{ delay: 0.4 + i * 0.09 }}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 15 } }}
              className="group text-center cursor-pointer relative"
              onClick={() => handleTap(p.name)}
            >
              {/* Speech bubble — hover on desktop, tap on mobile */}
              <div
                className={`absolute -top-14 left-1/2 -translate-x-1/2 transition-all duration-200 pointer-events-none z-10 ${
                  isTapped
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
                }`}
              >
                <div className="bg-white border border-accent/20 rounded-lg px-3 py-1.5 shadow-[0_4px_16px_rgba(61,155,143,0.12)] whitespace-nowrap">
                  <p className="text-[11px] font-medium text-foreground tracking-[-0.01em]">{p.greeting}</p>
                </div>
                <div className="w-2.5 h-2.5 bg-white border-b border-r border-accent/20 rotate-45 mx-auto -mt-[5px]" />
              </div>

              <motion.div
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all duration-300 mx-auto shadow-sm ${
                  isTapped
                    ? "border-accent/50 shadow-[0_6px_20px_rgba(61,155,143,0.2)]"
                    : "border-border/40 group-hover:border-accent/50 group-hover:shadow-[0_6px_20px_rgba(61,155,143,0.2)]"
                }`}
              >
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <p className={`text-[10px] font-semibold mt-2 hidden sm:block tracking-[0.06em] transition-colors duration-300 ${
                isTapped
                  ? "text-accent/70"
                  : "text-muted-foreground/50 group-hover:text-accent/70"
              }`}>
                {p.name}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="h-10" />

      {/* Input box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-lg pb-12 sm:pb-0"
      >
        <div className="relative bg-white border border-border/80 rounded-xl shadow-[0_2px_24px_rgba(61,155,143,0.06)] hover:shadow-[0_4px_32px_rgba(61,155,143,0.1)] transition-shadow focus-within:shadow-[0_4px_32px_rgba(61,155,143,0.14)] focus-within:border-accent/25">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={"Describe your idea here..."}
            disabled={disabled}
            rows={4}
            style={{ padding: "2rem 3rem 5.5rem 3rem" }}
            className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground/28 focus:outline-none text-[15px] leading-[1.7] disabled:opacity-50"
          />
          <div className="absolute bottom-6 right-6">
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center disabled:opacity-25 hover:bg-accent/90 transition-all shadow-sm hover:shadow-[0_4px_16px_rgba(61,155,143,0.3)] active:scale-[0.95]"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
