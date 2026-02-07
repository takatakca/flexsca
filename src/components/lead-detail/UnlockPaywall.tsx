import { Lock, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface UnlockPaywallProps {
  leadId: string;
  category: string;
  cost: number;
  balance: number | null;
  onUnlocked: () => void;
}

export default function UnlockPaywall({
  leadId,
  category,
  cost,
  balance,
  onUnlocked,
}: UnlockPaywallProps) {
  const [unlocking, setUnlocking] = useState(false);
  const hasEnough = (balance ?? 0) >= cost;

  const handleUnlock = async () => {
    setUnlocking(true);
    const { data, error } = await supabase.rpc("unlock_lead", {
      p_lead_id: leadId,
    });

    if (error) {
      const msg = error.message.includes("Insufficient credits")
        ? "Not enough credits to unlock this lead"
        : "Failed to unlock lead";
      toast.error(msg);
    } else {
      const spent = data as number;
      if (spent === 0) {
        toast.info("Lead already unlocked!");
      } else {
        toast.success(`Lead unlocked! ${spent} credits used.`);
      }
      onUnlocked();
    }
    setUnlocking(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="h-8 w-8 text-primary" />
      </div>

      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          Unlock this lead
        </h3>
        <p className="text-sm text-muted-foreground">
          Respond to <span className="font-medium text-foreground">{category}</span> by
          spending credits.
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{cost}</p>
          <p className="text-xs text-muted-foreground">Credits needed</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className={`text-2xl font-bold ${hasEnough ? "text-success" : "text-destructive"}`}>
            {balance ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Your balance</p>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full max-w-xs rounded-xl h-12 text-base font-semibold"
        disabled={!hasEnough || unlocking}
        onClick={handleUnlock}
      >
        {unlocking ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Unlocking…
          </>
        ) : (
          <>
            <Coins className="h-5 w-5 mr-2" />
            {hasEnough ? `Unlock for ${cost} credits` : "Not enough credits"}
          </>
        )}
      </Button>

      {!hasEnough && (
        <p className="text-xs text-muted-foreground">
          You need {cost - (balance ?? 0)} more credits.{" "}
          <button
            className="text-primary font-medium hover:underline"
            onClick={() => toast.info("Credit purchasing coming soon!")}
          >
            Buy credits
          </button>
        </p>
      )}
    </div>
  );
}
