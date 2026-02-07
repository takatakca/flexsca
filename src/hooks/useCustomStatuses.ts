import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CustomStatus {
  id: string;
  agent_id: string;
  category: string;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export function useCustomStatuses() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<CustomStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("custom_statuses")
      .select("*")
      .eq("agent_id", user.id)
      .order("category")
      .order("sort_order");

    if (data) setStatuses(data as CustomStatus[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const byCategory = (cat: string) => statuses.filter((s) => s.category === cat);

  const createStatus = useCallback(
    async (name: string, category: string, color: string) => {
      if (!user) return;
      const maxOrder = statuses
        .filter((s) => s.category === category)
        .reduce((max, s) => Math.max(max, s.sort_order), -1);

      const { data, error } = await supabase
        .from("custom_statuses")
        .insert({
          agent_id: user.id,
          name,
          category,
          color,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (!error && data) {
        setStatuses((prev) => [...prev, data as CustomStatus]);
      }
      return { data, error };
    },
    [user, statuses]
  );

  const deleteStatus = useCallback(
    async (statusId: string) => {
      const { error } = await supabase
        .from("custom_statuses")
        .delete()
        .eq("id", statusId);

      if (!error) {
        setStatuses((prev) => prev.filter((s) => s.id !== statusId));
      }
      return { error };
    },
    []
  );

  return { statuses, loading, byCategory, createStatus, deleteStatus, refetch: fetchStatuses };
}
