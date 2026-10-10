import QuoteComposer from "@/components/lead-detail/QuoteComposer";
import QuoteList from "@/components/lead-detail/QuoteList";
import RefundRequest from "@/components/lead-detail/RefundRequest";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useLeadAgentState } from "@/hooks/useLeadAgentState";
import { useContactLead } from "@/hooks/useContactLead";
import { useCredits } from "@/hooks/useCredits";
import { useCustomStatuses } from "@/hooks/useCustomStatuses";
import LeadHeader from "@/components/lead-detail/LeadHeader";
import LeadAnswers from "@/components/lead-detail/LeadAnswers";
import {
  FirstToRespondBanner,
  SetReminderButton,
  Highlights,
  ContactDetailsSection,
  CreditsCostDisplay,
} from "@/components/lead-detail/LeadInfoSections";
import MessageThread from "@/components/lead-detail/MessageThread";
import MessageInput from "@/components/lead-detail/MessageInput";
import ContactButton from "@/components/lead-detail/ContactButton";
import ReminderModal from "@/components/leads/ReminderModal";

interface Lead {
  id: string;
  category: string;
  location_text: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  details: string | null;
  status: string;
  credits_cost: number;
  is_urgent: boolean;
  has_additional_details: boolean;
  answers: Record<string, unknown>;
  city: string | null;
  postal_code: string | null;
  created_at: string;
}

interface Message {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

export default function LeadDetail() {
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  const {
    state: agentState,
    loading: stateLoading,
    markRead,
    toggleArchive,
    refetch: refetchState,
  } = useLeadAgentState(id);
  const { contactLead, contacting } = useContactLead();
  const { balance, refetch: refetchCredits } = useCredits();
  const { statuses } = useCustomStatuses();

  const isContacted = agentState?.contacted ?? false;
  const isArchived = agentState?.is_archived ?? false;
  const isFirstToRespond = agentState?.first_to_respond ?? false;

  // Fetch lead data
  useEffect(() => {
    if (!id || !user) return;

    const fetchData = async () => {
      const [leadRes, messagesRes] = await Promise.all([
        supabase.from("leads_safe").select("*").eq("id", id).single(),
        supabase
          .from("lead_messages")
          .select("*")
          .eq("lead_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (leadRes.data) setLead(leadRes.data as Lead);
      if (messagesRes.data) setMessages(messagesRes.data as Message[]);
      setLoading(false);
    };

    fetchData();
  }, [id, user]);

  // Mark as read when opening
  useEffect(() => {
    if (agentState?.is_unread) {
      markRead();
    }
  }, [agentState?.is_unread, markRead]);

  // Realtime messages
  const handleRealtimeMessage = useCallback((newMsg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  }, []);

  useRealtimeMessages(id, handleRealtimeMessage);

  // Contact lead (spend credits)
  const handleContact = async () => {
    if (!id) return;
    const result = await contactLead(id);
    if (result) {
      setLead(prev => prev ? { ...prev, customer_name: result.customer_name, customer_email: result.customer_email, customer_phone: result.customer_phone } : prev);
      const { data } = await supabase.from("leads_safe").select("*").eq("id", id).single();
      if (data) setLead(data as Lead);
      const { data: thread } = await supabase.from("lead_messages").select("*").eq("lead_id", id).order("created_at");
      if (thread) setMessages(thread);
      refetchState();
      refetchCredits();
    }
  };

  const sendQuote = async (quote: { message: string; priceMin: number | null; priceMax: number | null; availability: string | null }) => {
    if (!id || sending) return false;
    setSending(true);
    try {
      const { error } = await supabase.rpc("send_quote", { p_lead_id: id, p_message: quote.message, p_price_min: quote.priceMin, p_price_max: quote.priceMax, p_availability: quote.availability });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["quotes", id] });
      toast.success("Quote sent.");
      return true;
    } catch { toast.error("Unable to send quote. Check your price range and try again."); return false; }
    finally { setSending(false); }
  };

  // Send message
  const sendMessage = async (text: string) => {
    if (!text.trim() || !id || !user) return;
    setSending(true);
    const { data, error } = await supabase
      .from("lead_messages")
      .insert({
        lead_id: id,
        sender_type: "pro",
        message: text.trim(),
        agent_id: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => prev.some(m => m.id === data.id) ? prev : [...prev, data as Message]);
      setNewMessage("");
    } else { toast.error("Unable to send message. Please try again."); }
    setSending(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(newMessage);
  };

  // Archive toggle
  const handleArchiveToggle = async () => {
    const success = await toggleArchive();
    if (success) {
      const wasArchived = agentState?.is_archived;
      toast.success(wasArchived ? "Lead restored" : "Lead archived");
      if (!wasArchived) navigate("/app/leads");
    } else {
      toast.error("Failed to update archive status");
    }
  };

  // Custom status changed
  const handleCustomStatusChanged = (_statusId: string) => {
    refetchState();
  };

  if (loading || stateLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Lead not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-7.5rem)]">
      <LeadHeader
        lead={lead}
        isContacted={isContacted}
        isArchived={isArchived}
        customStatusId={agentState?.custom_status_id ?? null}
        customStatuses={statuses}
        onArchiveToggle={handleArchiveToggle}
        onCustomStatusChanged={handleCustomStatusChanged}
      />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Pre-contact info sections */}
        {!isContacted && !isArchived && (
          <>
            <FirstToRespondBanner isFirstToRespond={isFirstToRespond} />
            <SetReminderButton onSetReminder={() => setReminderOpen(true)} />

            <Highlights
              hasPhone={!!lead.customer_phone}
              hasAdditionalDetails={lead.has_additional_details || !!lead.details}
            />

            <ContactDetailsSection
              phone={lead.customer_phone}
              email={lead.customer_email}
              isContacted={false}
            />

            <CreditsCostDisplay creditsCost={lead.credits_cost} />
          </>
        )}

        {/* Revealed contact info when contacted */}
        {isContacted && (
          <ContactDetailsSection
            phone={lead.customer_phone}
            email={lead.customer_email}
            isContacted={true}
          />
        )}

        {/* Lead Q&A details */}
        <div className="mt-4">
          <div className="px-4 mb-1">
            <h3 className="text-base font-bold text-foreground">Details</h3>
          </div>
          <LeadAnswers
            answers={lead.answers}
            details={lead.details}
            locationText={lead.location_text}
            city={lead.city}
            postalCode={lead.postal_code}
          />
        </div>

        {/* Messages (only visible when contacted) */}
        {isContacted && (
          <div className="p-4 space-y-3">
            <QuoteComposer onSend={sendQuote} sending={sending} disabled={lead.status === "won" || lead.status === "lost"} />
            <QuoteList leadId={id!} />
            <MessageThread messages={messages} />
            <RefundRequest leadId={id!} />
          </div>
        )}
      </div>

      {/* Bottom: contact button OR message input */}
      {!isContacted && !isArchived ? (
        <ContactButton
          customerName={lead.customer_name}
          creditsCost={lead.credits_cost}
          balance={balance}
          onContact={handleContact}
          contacting={contacting}
        />
      ) : isContacted && !isArchived ? (
        <MessageInput
          value={newMessage}
          onChange={setNewMessage}
          onSubmit={handleSendMessage}
          sending={sending}
        />
      ) : null}

      {/* Reminder modal */}
      {id && lead && (
        <ReminderModal
          open={reminderOpen}
          onClose={() => setReminderOpen(false)}
          leadId={id}
          leadCategory={lead.category}
          customerName={lead.customer_name}
        />
      )}
    </div>
  );
}
