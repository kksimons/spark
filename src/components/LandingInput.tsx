import { useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface LandingInputProps {
  onSubmit: (idea: string) => void;
  disabled?: boolean;
}

export function LandingInput({ onSubmit, disabled }: LandingInputProps) {
  const [value, setValue] = useState("");

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 sm:px-10">
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

      {/* Persona preview with hover animations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex justify-center gap-5 sm:gap-6"
      >
        {[
          { name: "Dayee", dept: "Security", avatar: "/dayee.png" },
          { name: "Nathan", dept: "Digital", avatar: "/nathan.png" },
          { name: "Dana", dept: "Architecture", avatar: "/dana.png" },
          { name: "Lalindra", dept: "Design", avatar: "/lalindra.png" },
          { name: "Kyle", dept: "Engineering", avatar: "/kyle.png" },
        ].map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.09 }}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 15 } }}
            className="group text-center cursor-default"
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-border/40 group-hover:border-accent/50 transition-all duration-300 group-hover:shadow-[0_6px_20px_rgba(61,155,143,0.2)] mx-auto shadow-sm"
            >
              <img
                src={p.avatar}
                alt={p.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <p className="text-[10px] font-semibold text-muted-foreground/50 group-hover:text-accent/70 mt-2 hidden sm:block tracking-[0.06em] transition-colors duration-300">
              {p.name}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <div className="h-10" />

      {/* Input box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="relative bg-white border border-border/80 rounded-xl shadow-[0_2px_24px_rgba(61,155,143,0.06)] hover:shadow-[0_4px_32px_rgba(61,155,143,0.1)] transition-shadow focus-within:shadow-[0_4px_32px_rgba(61,155,143,0.14)] focus-within:border-accent/25">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={"Describe your idea here..."}
            disabled={disabled}
            rows={4}
            style={{ padding: "1.75rem 2.5rem 5rem 2.5rem" }}
            className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground/28 focus:outline-none text-[15px] leading-[1.7] disabled:opacity-50"
          />
          <div className="absolute bottom-5 right-5">
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
