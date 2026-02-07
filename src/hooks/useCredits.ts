import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreditTransaction {
  id: string;
  delta: number;
  reason: string;
  lead_id: string | null;
  created_at: string;
}

export function useCredits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!user) return;

    const [walletRes, txRes] = await Promise.all([
      supabase
        .from("credit_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("credit_transactions")
        .select("id, delta, reason, lead_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (walletRes.data) setBalance(walletRes.data.balance);
    if (txRes.data) setTransactions(txRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchWallet();
  }, [fetchWallet]);

  return { balance, transactions, loading, refetch };
}
