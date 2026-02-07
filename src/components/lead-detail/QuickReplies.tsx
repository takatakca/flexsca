const quickReplies = [
  "I'm interested in this job!",
  "I'd like to discuss pricing.",
  "I can start this week.",
  "Can we schedule a call?",
  "I'll send a detailed quote shortly.",
];

interface QuickRepliesProps {
  onSelect: (text: string) => void;
  disabled: boolean;
}

export default function QuickReplies({ onSelect, disabled }: QuickRepliesProps) {
  return (
    <div className="px-3 py-2 flex gap-2 overflow-x-auto border-t bg-muted/30">
      {quickReplies.map((reply) => (
        <button
          key={reply}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="shrink-0 rounded-full border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors active:scale-95"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
