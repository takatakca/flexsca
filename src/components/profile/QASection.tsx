import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ProviderQA } from "@/hooks/useProviderProfile";

const ALL_QUESTIONS = [
  "How long have you been in business?",
  "Do you bring your own equipment and supplies?",
  "What do you love most about your job?",
  "What inspired you to start your own business?",
  "Why should our clients choose you?",
  "Can you provide your services online or remotely? If so, please add details.",
  "What changes have you made to keep your customers safe from Covid-19?",
];

const MIN_CHARS = 50;

interface Props {
  qas: ProviderQA[];
  onSaveAll: (entries: { question: string; answer: string }[]) => Promise<void>;
}

export default function QASection({ qas, onSaveAll }: Props) {
  // Build a map of question → answer from existing data
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Populate answers from existing QAs on mount/change
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const qa of qas) {
      map[qa.question] = qa.answer;
    }
    // Also keep any local edits for questions not yet saved
    setAnswers((prev) => {
      const merged = { ...map };
      for (const q of ALL_QUESTIONS) {
        if (!merged[q] && prev[q]) {
          merged[q] = prev[q];
        }
      }
      return merged;
    });
  }, [qas]);

  const filledCount = ALL_QUESTIONS.filter(
    (q) => (answers[q] || "").trim().length >= MIN_CHARS
  ).length;

  const allFilled = filledCount === ALL_QUESTIONS.length;

  const handleSave = async () => {
    const entries = ALL_QUESTIONS
      .filter((q) => (answers[q] || "").trim().length >= MIN_CHARS)
      .map((q) => ({ question: q, answer: answers[q].trim() }));

    if (entries.length === 0) return;

    setSaving(true);
    await onSaveAll(entries);
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">Get started!</span>
          <span className="text-xs text-muted-foreground">
            {filledCount}/{ALL_QUESTIONS.length} answered
          </span>
        </div>
        {allFilled && (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        )}
      </div>

      {/* All questions */}
      {ALL_QUESTIONS.map((question) => {
        const value = answers[question] || "";
        const charCount = value.trim().length;
        const isValid = charCount >= MIN_CHARS;

        return (
          <div key={question} className="space-y-2">
            <label className="text-sm font-medium text-foreground leading-snug block">
              {question}
            </label>
            <Textarea
              value={value}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [question]: e.target.value }))
              }
              placeholder={`Minimum ${MIN_CHARS} characters`}
              className="rounded-xl min-h-[80px] text-sm"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <p
                className={`text-xs ${
                  isValid ? "text-muted-foreground" : "text-destructive"
                }`}
              >
                {charCount}/{MIN_CHARS} min
              </p>
              {isValid && (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
          </div>
        );
      })}

      <Button
        onClick={handleSave}
        disabled={saving || filledCount === 0}
        className="w-full rounded-xl"
      >
        {saving ? "Saving…" : `Save answers (${filledCount})`}
      </Button>
    </div>
  );
}
