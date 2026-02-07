import { Coins, TrendingUp, TrendingDown, Gift, ArrowLeftRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCredits } from "@/hooks/useCredits";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const reasonLabels: Record<string, { label: string; icon: typeof TrendingUp }> = {
  purchase: { label: "Credits purchased", icon: TrendingUp },
  spend_lead: { label: "Lead unlocked", icon: TrendingDown },
  refund: { label: "Refund", icon: ArrowLeftRight },
  admin_adjust: { label: "Adjustment", icon: ArrowLeftRight },
  signup_bonus: { label: "Welcome bonus", icon: Gift },
};

export default function WalletCard() {
  const { balance, transactions, loading } = useCredits();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins className="h-4 w-4" /> Credits
        </CardTitle>
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

        {/* Buy credits stub */}
        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => toast.info("Credit purchasing coming soon!")}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Buy credits
        </Button>

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
