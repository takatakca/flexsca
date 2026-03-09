import { Loader2 } from "lucide-react";

interface ContactButtonProps {
  customerName: string | null;
  creditsCost: number;
  balance: number | null;
  onContact: () => void;
  contacting: boolean;
}

export default function ContactButton({
  customerName,
  creditsCost,
  balance,
  onContact,
  contacting,
}: ContactButtonProps) {
  const hasEnough = (balance ?? 0) >= creditsCost;
  const name = customerName?.split(" ")[0] || "Customer";

  return (
    <div className="sticky bottom-0 bg-background px-4 pb-4 pt-2 border-t border-border">
      {/* Credit info (only show if not enough) */}
      {!hasEnough && (
        <p className="text-xs text-muted-foreground text-center mb-2">
          You need {creditsCost} credits ({creditsCost - (balance ?? 0)} more).
        </p>
      )}

      {/* Full-width CTA */}
      <button
        disabled={!hasEnough || contacting}
        onClick={onContact}
        className="w-full rounded-xl py-3.5 text-base font-bold text-white transition-colors disabled:opacity-50"
        style={{
          backgroundColor: hasEnough ? "#22C55E" : "#9CA3AF",
        }}
      >
        {contacting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </span>
        ) : hasEnough ? (
          `Contact ${name}`
        ) : (
          "Not enough credits"
        )}
      </button>
    </div>
  );
}
