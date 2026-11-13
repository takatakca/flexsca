import { useEffect, useState } from "react";
import { Send, Loader2, DollarSign, CalendarDays, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const quickTemplates = [
  "I'm interested in this job!",
  "I'd like to discuss pricing.",
  "I can start this week.",
  "I'll send a detailed quote shortly.",
];

const availabilityOptions = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_week", label: "This week" },
  { value: "custom", label: "Custom" },
] as const;

interface QuoteComposerProps {
  onSend: (data: {
    message: string;
    priceMin: number | null;
    priceMax: number | null;
    availability: string | null;
  }) => Promise<boolean>;
  sending: boolean;
  disabled?: boolean;
  /** When set, a professional who unlocked this request can ask for an AI-written first draft. */
  leadId?: string;
}

export default function QuoteComposer({ onSend, sending, disabled, leadId }: QuoteComposerProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [availability, setAvailability] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  // The button only appears when the server reports that AI drafting is switched on.
  useEffect(() => {
    if (!open || !leadId) return;
    let cancelled = false;
    supabase.functions.invoke("ai-assist", { body: { task: "status" } })
      .then(({ data }) => { if (!cancelled) setAiEnabled(Boolean(data?.enabled)); })
      .catch(() => { if (!cancelled) setAiEnabled(false); });
    return () => { cancelled = true; };
  }, [open, leadId]);

  const draftWithAi = async () => {
    if (drafting || !leadId) return;
    setDrafting(true); setAiNote(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assist", { body: { task: "quote_reply", leadId } });
      if (error || !data?.draft) {
        const details = await (error as { context?: Response } | null)?.context?.json?.().catch(() => null);
        setAiNote(details?.code === "limit_reached" ? "You have used today's AI drafts. Try again tomorrow."
          : details?.code === "not_unlocked" ? "Unlock this request before drafting a reply."
          : "A draft could not be written right now. You can still write your own message.");
        return;
      }
      setMessage(String(data.draft));
      setAiNote("AI draft. Read it and edit it before you send: you are responsible for what it says.");
    } catch {
      setAiNote("A draft could not be written right now. You can still write your own message.");
    } finally { setDrafting(false); }
  };

  const resetForm = () => {
    setMessage("");
    setPriceMin("");
    setPriceMax("");
    setAvailability(null);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const sent = await onSend({
      message: message.trim(),
      priceMin: priceMin ? parseFloat(priceMin) : null,
      priceMax: priceMax ? parseFloat(priceMax) : null,
      availability,
    });

    if (!sent) return;
    resetForm();
    setOpen(false);
  };

  const handleQuickTemplate = (text: string) => {
    setMessage(text);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="w-full rounded-xl text-base font-semibold h-12"
          disabled={disabled}
        >
          <Send className="h-5 w-5 mr-2" />
          Send quote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send a quote</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Quick templates */}
          <div className="flex flex-wrap gap-2">
            {quickTemplates.map((t) => (
              <button
                key={t}
                onClick={() => handleQuickTemplate(t)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  message === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground hover:bg-accent border-border"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="quote-message">Your message</Label>
              {aiEnabled && leadId && (
                <Button type="button" variant="outline" size="sm" onClick={() => void draftWithAi()} disabled={drafting}>
                  {drafting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                  {drafting ? "Writing…" : "Draft with AI"}
                </Button>
              )}
            </div>
            <Textarea
              placeholder="Write your response to the customer…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
              id="quote-message"
            />
            {aiNote && <p role="status" className="text-xs text-muted-foreground">{aiNote}</p>}
          </div>

          {/* Price range (CAD) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              Price estimate in CAD (optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                min={0}
                className="flex-1"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <Input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                min={0}
                className="flex-1"
              />
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Availability (optional)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {availabilityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setAvailability(availability === opt.value ? null : opt.value)
                  }
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    availability === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground hover:bg-accent border-border"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="w-full rounded-xl h-11 text-base font-semibold"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send quote
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
