import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface LeadAgentState {
  lead_id: string;
  agent_id: string;
  is_unread: boolean;
  is_archived: boolean;
  archived_at: string | null;
  contacted: boolean;
  contacted_at: string | null;
  first_to_respond: boolean;
  created_at: string;
  updated_at: string;
}

export function useLeadAgentState(leadId: string | undefined) {
  const { user } = useAuth();
  const [state, setState] = useState<LeadAgentState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    if (!user || !leadId) {
      setLoading(false);
      return;
    }

    // Ensure state row exists (upsert)
    await supabase
      .from("lead_agent_state")
      .upsert(
        { lead_id: leadId, agent_id: user.id },
        { onConflict: "lead_id,agent_id", ignoreDuplicates: true }
      );

    const { data } = await supabase
      .from("lead_agent_state")
      .select("*")
      .eq("lead_id", leadId)
      .eq("agent_id", user.id)
      .single();

    if (data) setState(data as LeadAgentState);
    setLoading(false);
  }, [user, leadId]);

  useEffect(() => {
    setLoading(true);
    setState(null);
    fetchState();
  }, [fetchState]);

  const markRead = useCallback(async () => {
    if (!user || !leadId) return;
    await supabase
      .from("lead_agent_state")
      .update({ is_unread: false, updated_at: new Date().toISOString() })
      .eq("lead_id", leadId)
      .eq("agent_id", user.id);
    setState((prev) => (prev ? { ...prev, is_unread: false } : prev));
  }, [user, leadId]);

  const toggleArchive = useCallback(async () => {
    if (!user || !leadId || !state) return;
    const newArchived = !state.is_archived;
    const { error } = await supabase
      .from("lead_agent_state")
      .update({
        is_archived: newArchived,
        archived_at: newArchived ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("lead_id", leadId)
      .eq("agent_id", user.id);

    if (!error) {
      setState((prev) =>
        prev
          ? {
              ...prev,
              is_archived: newArchived,
              archived_at: newArchived ? new Date().toISOString() : null,
            }
          : prev
      );
    }
    return !error;
  }, [user, leadId, state]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchState();
  }, [fetchState]);

  return { state, loading, markRead, toggleArchive, refetch };
}
