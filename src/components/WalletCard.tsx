import { errorMessage } from "@/lib/errors";
import { Coins, TrendingUp, TrendingDown, Gift, ArrowLeftRight, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

const PACKAGES = [
  { id: "pack_20", credits: 20, price: "$19", label: "Starter" },
  { id: "pack_50", credits: 50, price: "$39", label: "Popular", popular: true },
  { id: "pack_120", credits: 120, price: "$79", label: "Best Value" },
];

const reasonLabels: Record<string, { label: string; icon: typeof TrendingUp }> = {
  purchase: { label: "Credits purchased", icon: TrendingUp },
  spend_lead: { label: "Lead unlocked", icon: TrendingDown },
  refund: { label: "Refund", icon: ArrowLeftRight },
  admin_adjust: { label: "Adjustment", icon: ArrowLeftRight },
  signup_bonus: { label: "Welcome bonus", icon: Gift },
};

export default function WalletCard() {
  const { balance, transactions, loading, error, refetch } = useCredits();
  const [buyingPackage, setBuyingPackage] = useState<string | null>(null);

  const handleBuyCredits = async (packageId: string) => {
    if (buyingPackage) return;
    setBuyingPackage(packageId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in first");
        setBuyingPackage(null);
        return;
      }

      const response = await supabase.functions.invoke("create-checkout-session", {
        body: {
          packageId,
          origin: window.location.origin,
        },
      });

      if (response.error) {
        throw new Error(errorMessage(response.error, "Failed to create checkout"));
      }

      const { url } = response.data;
      if (url) {
        const checkout = new URL(url);
        if (checkout.protocol !== "https:" || checkout.hostname !== "checkout.stripe.com" || checkout.username || checkout.password) throw new Error("Invalid checkout URL returned");
        window.location.assign(checkout.toString());
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: unknown) {
      console.error("Buy credits error:", err);
      toast.error(errorMessage(err, "Failed to start checkout"));
      setBuyingPackage(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) return <Card><CardContent role="alert" className="p-6 space-y-4"><p>{error.message}</p><Button onClick={() => void refetch()}>Retry credit history</Button></CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center gap-3"><CardTitle className="flex items-center gap-2 text-base">
          <Coins className="h-4 w-4" /> Credits
        </CardTitle><Button variant="ghost" size="sm" onClick={() => void refetch()}>Refresh credits</Button></div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance display */}
        <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/10 p-4">
          <div>
            <p className="text-sm text-muted-foreground">Current balance</p>
            <p className="text-3xl font-bold text-foreground">{balance ?? 0}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Coins className="h-6 w-6 text-primary" />
          </div>
        </div>

        {/* Credit packages */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">Buy credits · CAD</p>
          <div className="grid grid-cols-3 gap-2">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleBuyCredits(pkg.id)}
                disabled={buyingPackage !== null}
                className={`relative flex flex-col items-center rounded-xl border p-3 transition-all ${
                  pkg.popular
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/50"
                } ${buyingPackage === pkg.id ? "opacity-70" : "hover:shadow-md active:scale-[0.97]"}`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    <Sparkles className="h-2.5 w-2.5" /> Popular
                  </span>
                )}
                <span className="text-xl font-bold text-foreground mt-1">{pkg.credits}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">credits</span>
                <span className="mt-1.5 text-sm font-semibold text-primary">{pkg.price}</span>
                {buyingPackage === pkg.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary mt-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Recent transactions</p>
              <div className="space-y-2">
                {transactions.slice(0, 10).map((tx) => {
                  const info = reasonLabels[tx.reason] || reasonLabels.admin_adjust;
                  const Icon = info.icon;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            tx.delta > 0
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm text-foreground">{info.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          tx.delta > 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {tx.delta > 0 ? "+" : ""}
                        {tx.delta}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
