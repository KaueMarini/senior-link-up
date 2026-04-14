import { Sparkles } from "lucide-react";

interface SmartRepliesProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

/**
 * Renders a row of contextual quick-reply chips.
 * Clicking a chip sets the parent's message input to that text
 * so the user can review/edit before sending.
 * Renders nothing when there are no suggestions.
 */
const SmartReplies = ({ suggestions, onSelect }: SmartRepliesProps) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-3 py-2 border-t bg-muted/20">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
          Sugestões inteligentes
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onSelect(text)}
            className="text-[12px] px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary
                       hover:bg-primary/15 hover:border-primary/50 active:scale-95
                       transition-all duration-150 cursor-pointer leading-snug"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SmartReplies;
