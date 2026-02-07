import { Coins, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const name = customerName || "Customer";

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/10 p-3">
        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-foreground">{creditsCost}</p>
          <p className="text-xs text-muted-foreground">Credits needed</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center flex-1">
          <p className={`text-2xl font-bold ${hasEnough ? "text-success" : "text-destructive"}`}>
            {balance ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Your balance</p>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full rounded-xl h-12 text-base font-semibold"
        disabled={!hasEnough || contacting}
        onClick={onContact}
      >
        {contacting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <UserCheck className="h-5 w-5 mr-2" />
            {hasEnough ? `Contact ${name}` : "Not enough credits"}
          </>
        )}
      </Button>

      {!hasEnough && (
        <p className="text-xs text-muted-foreground text-center">
          You need {creditsCost - (balance ?? 0)} more credits.
        </p>
      )}
    </div>
  );
}
