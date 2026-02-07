import { useState } from "react";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProviderQA } from "@/hooks/useProviderProfile";

const SUGGESTED_QUESTIONS = [
  "How long have you been in business?",
  "Do you bring your own equipment and supplies?",
  "What do you love most about your job?",
  "What inspired you to start your own business?",
  "Why should clients choose you?",
  "Can you provide services online or remotely?",
  "What are your Covid-19 safety measures?",
];

interface Props {
  qas: ProviderQA[];
  onAdd: (question: string, answer: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function QASection({ qas, onAdd, onRemove }: Props) {
  const [adding, setAdding] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const usedQuestions = new Set(qas.map((q) => q.question));
  const availableQuestions = SUGGESTED_QUESTIONS.filter(
    (q) => !usedQuestions.has(q)
  );

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) return;
    setSubmitting(true);
    await onAdd(question.trim(), answer.trim());
    setQuestion("");
    setAnswer("");
    setAdding(false);
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Answer common questions to build trust and remove buyer hesitation. These appear on your public profile.
      </p>

      {qas.map((qa) => (
        <div
          key={qa.id}
          className="rounded-xl border p-3 space-y-1"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{qa.question}</p>
            <button
              onClick={() => onRemove(qa.id)}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{qa.answer}</p>
        </div>
      ))}

      {adding ? (
        <div className="rounded-xl border p-3 space-y-3">
          {availableQuestions.length > 0 && (
            <Select value={question} onValueChange={setQuestion}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Pick a suggested question…" />
              </SelectTrigger>
              <SelectContent>
                {availableQuestions.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {question && (
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer…"
              className="rounded-xl min-h-[80px]"
              maxLength={500}
              autoFocus
            />
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              disabled={submitting || !question.trim() || !answer.trim()}
              size="sm"
              className="rounded-xl flex-1"
            >
              {submitting ? "Adding…" : "Save answer"}
            </Button>
            <Button
              onClick={() => {
                setAdding(false);
                setQuestion("");
                setAnswer("");
              }}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setAdding(true)}
          variant="outline"
          className="w-full rounded-xl"
          disabled={availableQuestions.length === 0}
        >
          <Plus className="h-4 w-4 mr-1" />{" "}
          {availableQuestions.length === 0 ? "All questions answered" : "Add Q&A"}
        </Button>
      )}

      {qas.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
          <HelpCircle className="h-8 w-8" />
          <p className="text-sm">No Q&A yet</p>
        </div>
      )}
    </div>
  );
}
