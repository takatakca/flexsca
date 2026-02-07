import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  sending: boolean;
}

export default function MessageInput({ value, onChange, onSubmit, sending }: MessageInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="border-t p-3 flex items-center gap-2 bg-background"
    >
      <Input
        placeholder="Type a message…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-full h-11"
      />
      <Button
        type="submit"
        size="icon"
        disabled={sending || !value.trim()}
        className="h-11 w-11 rounded-full shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
