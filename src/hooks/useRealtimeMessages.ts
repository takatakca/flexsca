import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

export function useRealtimeMessages(
  leadId: string | undefined,
  onNewMessage: (message: Message) => void
) {
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`lead-messages-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lead_messages",
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          onNewMessage(newMsg);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, onNewMessage]);
}
