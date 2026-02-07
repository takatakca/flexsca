import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import LeadHeader from "@/components/lead-detail/LeadHeader";
import MessageThread from "@/components/lead-detail/MessageThread";
import QuickReplies from "@/components/lead-detail/QuickReplies";
import MessageInput from "@/components/lead-detail/MessageInput";

interface Lead {
  id: string;
  category: string;
  location_text: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  details: string | null;
  status: string;
  archived: boolean;
  created_at: string;
}

interface Message {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");

  useEffect(() => {
    if (!id || !user) return;

    const fetchData = async () => {
      const [leadRes, messagesRes] = await Promise.all([
        supabase.from("leads").select("*").eq("id", id).single(),
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

  const sendMessage = async (text: string) => {
    if (!text.trim() || !id) return;

    setSending(true);
    const { data, error } = await supabase
      .from("lead_messages")
      .insert({
        lead_id: id,
        sender_type: "pro",
        message: text.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
      setNewMessage("");

      // Auto-update status to contacted if new
      if (lead?.status === "new") {
        await supabase.from("leads").update({ status: "contacted" }).eq("id", id);
        setLead((prev) => (prev ? { ...prev, status: "contacted" } : prev));
      }
    }
    setSending(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(newMessage);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !lead) return;
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      setLead((prev) => (prev ? { ...prev, status: newStatus } : prev));
      toast.success(`Status updated to ${newStatus}`);
    } else {
      toast.error("Failed to update status");
    }
  };

  const handleArchiveToggle = async () => {
    if (!id || !lead) return;
    const newArchived = !lead.archived;
    const { error } = await supabase
      .from("leads")
      .update({
        archived: newArchived,
        archived_at: newArchived ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (!error) {
      setLead((prev) =>
        prev ? { ...prev, archived: newArchived } : prev
      );
      toast.success(newArchived ? "Lead archived" : "Lead restored");
      if (newArchived) {
        navigate("/app/leads");
      }
    } else {
      toast.error("Failed to update archive status");
    }
  };

  const handleCreateReminder = async () => {
    if (!id || !user || !reminderDate) return;

    const { error } = await supabase.from("reminders").insert({
      lead_id: id,
      user_id: user.id,
      remind_at: new Date(reminderDate).toISOString(),
      note: reminderNote || null,
    });

    if (!error) {
      toast.success("Reminder created");
      setReminderOpen(false);
      setReminderDate("");
      setReminderNote("");
    } else {
      toast.error("Failed to create reminder");
    }
  };

  if (loading) {
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
        onStatusChange={handleStatusChange}
        onArchiveToggle={handleArchiveToggle}
        reminderOpen={reminderOpen}
        onReminderOpenChange={setReminderOpen}
        reminderDate={reminderDate}
        onReminderDateChange={setReminderDate}
        reminderNote={reminderNote}
        onReminderNoteChange={setReminderNote}
        onCreateReminder={handleCreateReminder}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <MessageThread messages={messages} />
      </div>

      <QuickReplies onSelect={sendMessage} disabled={sending} />

      <MessageInput
        value={newMessage}
        onChange={setNewMessage}
        onSubmit={handleSendMessage}
        sending={sending}
      />
    </div>
  );
}
