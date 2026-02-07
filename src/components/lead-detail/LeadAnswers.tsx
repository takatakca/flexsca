interface LeadAnswersProps {
  answers: Record<string, unknown>;
  details: string | null;
}

function prettyKey(k: string) {
  return k
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

export default function LeadAnswers({ answers, details }: LeadAnswersProps) {
  const entries = Object.entries(answers ?? {});

  if (entries.length === 0 && !details) {
    return null;
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <h3 className="font-semibold text-foreground text-sm">Details</h3>

      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(([k, v]) => (
            <div key={k} className="border-b border-border pb-2 last:border-0">
              <p className="text-xs text-muted-foreground">{prettyKey(k)}</p>
              <p className="text-sm font-medium text-foreground">{String(v)}</p>
            </div>
          ))}
        </div>
      )}

      {details && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">Additional details</p>
          <p className="text-sm text-foreground">{details}</p>
        </div>
      )}
    </div>
  );
}
