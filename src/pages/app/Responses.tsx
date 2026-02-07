import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface ConversationRow {
  id: string;
  category: string;
  location_text: string;
  status: string;
  last_message: string | null;
  last_message_time: string | null;
}

export default function Responses() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      // Single query: join leads with lead_last_message view
      const { data: leads } = await supabase
        .from("leads")
        .select("id, category, location_text, status, last_activity_at")
        .eq("archived", false)
        .order("last_activity_at", { ascending: false });

      if (!leads || leads.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch last messages for all leads in one query
      const { data: lastMessages } = await supabase
        .from("lead_last_message")
        .select("lead_id, message, created_at");

      const messageMap = new Map(
        (lastMessages || []).map((m) => [m.lead_id, m])
      );

      const convos: ConversationRow[] = leads
        .map((lead) => {
          const msg = messageMap.get(lead.id);
          return {
            id: lead.id,
            category: lead.category,
            location_text: lead.location_text,
            status: lead.status,
            last_message: msg?.message || null,
            last_message_time: msg?.created_at || null,
          };
        })
        .filter((c) => c.last_message !== null);

      setConversations(convos);
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
            {convo.last_message_time && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(convo.last_message_time), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
          {convo.last_message && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {convo.last_message}
            </p>
          )}
          <span className="text-xs text-muted-foreground">
            {convo.location_text}
          </span>
        </Card>
      ))}
    </div>
  );
}
