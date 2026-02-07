import { MapPin } from "lucide-react";

interface LeadAnswersProps {
  answers: Record<string, unknown>;
  details: string | null;
  locationText?: string;
  city?: string | null;
  postalCode?: string | null;
}

function prettyKey(k: string) {
  return k
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

export default function LeadAnswers({
  answers,
  details,
  locationText,
  city,
  postalCode,
}: LeadAnswersProps) {
  const entries = Object.entries(answers ?? {});

  if (entries.length === 0 && !details && !locationText) {
    return null;
  }

  return (
    <div className="space-y-0">
      {/* Q&A rows (Bark-style) */}
      {entries.length > 0 && (
        <div className="divide-y divide-border">
          {entries.map(([k, v]) => (
            <div key={k} className="px-4 py-3.5">
              <p className="text-sm text-muted-foreground mb-1">{prettyKey(k)}</p>
              <p className="text-base font-semibold text-foreground">{String(v)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Additional Details */}
      {details && (
        <div className="border-t border-border px-4 py-3.5">
          <p className="text-sm text-primary mb-1">Additional Details</p>
          <p className="text-base font-semibold text-foreground">{details}</p>
        </div>
      )}

      {/* Location section */}
      {locationText && (
        <div className="border-t border-border px-4 py-4">
          <h3 className="text-base font-bold text-foreground mb-3">Location</h3>

          {/* Map placeholder */}
          <div className="rounded-xl bg-muted h-48 flex items-center justify-center mb-3 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-muted/80 to-muted" />
            <div className="relative flex flex-col items-center gap-2">
              <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <MapPin className="h-7 w-7 text-primary/60" />
              </div>
              <p className="text-xs text-muted-foreground">Map view</p>
            </div>
          </div>

          <p className="text-sm font-medium text-foreground">
            {[city, postalCode].filter(Boolean).join(", ") || locationText}
          </p>
        </div>
      )}
    </div>
  );
}
