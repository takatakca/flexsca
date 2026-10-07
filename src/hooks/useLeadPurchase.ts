import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LeadPurchaseInfo {
  purchased: boolean;
  cost: number;
  loading: boolean;
}

export function useLeadPurchase(leadId: string | undefined, category?: string): LeadPurchaseInfo & { refetch: () => void } {
  const { user } = useAuth();
  const [purchased, setPurchased] = useState(false);
  const [cost, setCost] = useState(5);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user || !leadId) {
      setLoading(false);
      return;
    }

    const [purchaseRes, pricingRes] = await Promise.all([
      supabase
        .from("lead_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("lead_id", leadId)
        .limit(1),
      category
        ? supabase
            .from("lead_pricing_rules")
            .select("base_cost")
            .eq("category", category)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    if (purchaseRes.data && purchaseRes.data.length > 0) {
      setPurchased(true);
    }

    if (pricingRes.data && 'base_cost' in pricingRes.data) {
      setCost(pricingRes.data.base_cost);
    }

    setLoading(false);
  }, [user, leadId, category]);

  useEffect(() => {
    setLoading(true);
    setPurchased(false);
    setCost(5);
    fetch();
  }, [fetch]);

  const refetch = () => {
    setLoading(true);
    fetch();
  };

  return { purchased, cost, loading, refetch };
}
