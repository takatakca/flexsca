import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface LeadWithMessages {
  id: string;
  category: string;
  location_text: string;
  status: string;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
}

export default function Responses() {
  const [conversations, setConversations] = useState<LeadWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      // Fetch leads that have messages
      const { data: leads } = await supabase
        .from("leads")
        .select("id, category, location_text, status");

      if (!leads) {
        setLoading(false);
        return;
      }

      const leadsWithMessages: LeadWithMessages[] = [];

      for (const lead of leads) {
        const { data: messages, count } = await supabase
          .from("lead_messages")
          .select("message, created_at", { count: "exact" })
          .eq("lead_id", lead.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (messages && messages.length > 0) {
          leadsWithMessages.push({
            ...lead,
            lastMessage: messages[0].message,
            lastMessageTime: messages[0].created_at,
            messageCount: count || 0,
          });
        }
      }

      // Sort by most recent message
      leadsWithMessages.sort(
        (a, b) =>
          new Date(b.lastMessageTime).getTime() -
          new Date(a.lastMessageTime).getTime()
      );

      setConversations(leadsWithMessages);
      setLoading(false);
    };

    fetchConversations();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-medium">Loading responses…</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">No responses yet</h2>
        <p className="text-muted-foreground max-w-xs">
          When you respond to leads, your conversations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {conversations.map((convo) => (
        <Card
          key={convo.id}
          className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform"
          onClick={() => navigate(`/app/leads/${convo.id}`)}
        >
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-foreground">{convo.category}</h3>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(convo.lastMessageTime), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
            {convo.lastMessage}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {convo.location_text}
            </span>
            <Badge variant="secondary" className="text-xs">
              {convo.messageCount} message{convo.messageCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
