import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, MessageCircleQuestion } from "lucide-react";
import type { Persona } from "../types";

interface QuestionBubbleProps {
  persona: Persona;
  question: string;
  userAnswer: string | null;
  followup: string | null;
  isWaiting: boolean;
  onAnswer: (answer: string) => void;
}

export function QuestionBubble({
  persona,
  question,
  userAnswer,
  isWaiting,
  onAnswer,
}: QuestionBubbleProps) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isWaiting && !submitted) {
      setTimeout(() => inputRef.current?.focus(), 600);
    }
  }, [isWaiting, submitted]);

  useEffect(() => {
    if (userAnswer) setSubmitted(true);
  }, [userAnswer]);

  const handleSubmit = () => {
    if (value.trim() && !submitted) {
      onAnswer(value.trim());
      setSubmitted(true);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 350, damping: 20, delay: 0.3 }}
      className="w-full max-w-sm"
    >
      {/* Speech bubble */}
      <motion.div
        animate={
          !submitted
            ? {
                boxShadow: [
                  "0 0 0 0 rgba(61,155,143,0)",
                  "0 0 0 8px rgba(61,155,143,0.1)",
                  "0 0 0 0 rgba(61,155,143,0)",
                ],
              }
            : {}
        }
        transition={!submitted ? { duration: 2, repeat: Infinity } : {}}
        className="bg-white border-2 border-accent/30 rounded-2xl p-4 relative"
      >
        {/* Tail pointing up to the card */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-accent/30 rotate-45" />

        <div className="flex items-start gap-2 mb-3">
          <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 mt-0.5">
            <img src={persona.avatar} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageCircleQuestion className="w-3 h-3 text-accent" />
              <span className="text-[10px] font-bold text-accent uppercase tracking-[0.15em]">
                {persona.name} asks
              </span>
            </div>
            <p className="text-[13px] text-foreground leading-[1.65] tracking-[-0.006em]">{question}</p>
          </div>
        </div>

        {/* Answer input */}
        {!submitted ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Type your answer..."
              className="flex-1 bg-muted rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all tracking-[-0.006em]"
            />
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="w-9 h-9 bg-accent text-white rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-accent/90 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-muted/60 rounded-xl px-3 py-2">
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Your answer
            </p>
            <p className="text-sm text-foreground">
              {userAnswer || value}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
