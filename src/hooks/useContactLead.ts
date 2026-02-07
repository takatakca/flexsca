import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContactResult {
  already_contacted: boolean;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  credits_spent?: number;
}

export function useContactLead() {
  const [contacting, setContacting] = useState(false);

  const contactLead = useCallback(async (leadId: string): Promise<ContactResult | null> => {
    setContacting(true);
    try {
      const { data, error } = await supabase.rpc("contact_lead", {
        p_lead_id: leadId,
      });

      if (error) {
        if (error.message.includes("INSUFFICIENT_CREDITS")) {
          toast.error("Not enough credits to contact this lead");
        } else {
          toast.error("Failed to contact lead");
        }
        return null;
      }

      const result = data as unknown as ContactResult;
      if (!result.already_contacted) {
        toast.success(`Contact unlocked! ${result.credits_spent} credits used.`);
      }
      return result;
    } catch {
      toast.error("Something went wrong");
      return null;
    } finally {
      setContacting(false);
    }
  }, []);

  return { contactLead, contacting };
}
