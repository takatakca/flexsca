import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Mail, Send, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Lead {
  id: string;
  category: string;
  location_text: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  details: string | null;
  status: string;
  created_at: string;
}

interface Message {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  new: "bg-primary text-primary-foreground",
  contacted: "bg-warning text-warning-foreground",
  won: "bg-success text-success-foreground",
  lost: "bg-destructive text-destructive-foreground",
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    setSending(true);
    const { data, error } = await supabase
      .from("lead_messages")
      .insert({
        lead_id: id,
        sender_type: "pro",
        message: newMessage.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
      setNewMessage("");

      // Update lead status to contacted if it's new
      if (lead?.status === "new") {
        await supabase.from("leads").update({ status: "contacted" }).eq("id", id);
        setLead((prev) => (prev ? { ...prev, status: "contacted" } : prev));
      }
    }
    setSending(false);
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
      {/* Header */}
      <div className="border-b p-4">
        <button
          onClick={() => navigate("/app/leads")}
          className="flex items-center gap-1 text-sm text-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Back to leads
        </button>

        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-bold text-foreground">{lead.category}</h2>
          <Badge className={statusColors[lead.status] || ""}>
            {lead.status}
          </Badge>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {lead.location_text}
          </p>
          {lead.customer_name && <p>Customer: {lead.customer_name}</p>}
          {lead.customer_phone && (
            <p className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" /> {lead.customer_phone}
            </p>
          )}
          {lead.customer_email && (
            <p className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> {lead.customer_email}
            </p>
          )}
        </div>

        {lead.details && (
          <Card className="mt-3 p-3 bg-muted/50">
            <p className="text-sm text-foreground">{lead.details}</p>
          </Card>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No messages yet. Send a response to get started!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === "pro" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.sender_type === "pro"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : msg.sender_type === "system"
                    ? "bg-muted text-muted-foreground rounded-bl-md italic"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender_type === "pro"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(new Date(msg.created_at), "HH:mm")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t p-3 flex items-center gap-2 bg-background"
      >
        <Input
          placeholder="Type a message…"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 rounded-full h-11"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || !newMessage.trim()}
          className="h-11 w-11 rounded-full shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
