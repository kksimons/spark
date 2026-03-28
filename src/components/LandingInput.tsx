import { useState } from "react";
import { ArrowRight, Zap } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="max-w-xl w-full text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6">
          <Zap className="w-3 h-3" />
          AI-Powered Idea Evaluation
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
          What are you building?
        </h2>
        <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
          Describe your product idea, AI use case, or app concept. Five department specialists will evaluate it together.
        </p>
      </div>

      <div className="w-full max-w-xl">
        <div className="relative bg-white border border-border/80 rounded-2xl shadow-[0_2px_20px_rgba(61,155,143,0.08)] hover:shadow-[0_4px_30px_rgba(61,155,143,0.12)] transition-shadow focus-within:shadow-[0_4px_30px_rgba(61,155,143,0.15)] focus-within:border-accent/30">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., An AI tool that helps field workers report equipment issues using their phone camera..."
            disabled={disabled}
            rows={4}
            className="w-full resize-none bg-transparent px-5 pt-5 pb-16 text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-[15px] leading-relaxed disabled:opacity-50 rounded-2xl"
          />
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground/60">
              {value.length > 0 ? "Shift+Enter for new line" : ""}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              className="flex items-center gap-2 px-5 py-2 bg-accent text-white text-sm font-medium rounded-xl disabled:opacity-30 hover:bg-accent/90 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Evaluate
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
