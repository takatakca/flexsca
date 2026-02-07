import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2, PoundSterling, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface ResponseRow {
  id: string;
  lead_id: string;
  message: string;
  price_min: number | null;
  price_max: number | null;
  availability: string | null;
  status: string;
  created_at: string;
  // Joined from leads
  category: string;
  location_text: string;
  lead_status: string;
  // Joined from lead_last_message
  last_message: string | null;
  last_message_time: string | null;
}

const statusBadge: Record<string, { label: string; className: string }> = {
  sent: { label: "Sent", className: "bg-primary/10 text-primary border-primary/20" },
  accepted: { label: "Accepted", className: "bg-success/10 text-success border-success/20" },
  declined: { label: "Declined", className: "bg-destructive/10 text-destructive border-destructive/20" },
  withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground border-border" },
};

const availabilityLabels: Record<string, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  this_week: "This week",
  custom: "Custom",
};

export default function Responses() {
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchResponses = async () => {
      // Fetch responses with lead info
      const { data: respData } = await supabase
        .from("responses")
        .select("id, lead_id, message, price_min, price_max, availability, status, created_at")
        .order("created_at", { ascending: false });

      if (!respData || respData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch corresponding leads
      const leadIds = [...new Set(respData.map((r) => r.lead_id))];
      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, category, location_text, status")
        .in("id", leadIds);

      // Fetch last messages
      const { data: lastMessages } = await supabase
        .from("lead_last_message")
        .select("lead_id, message, created_at");

      const leadMap = new Map(
        (leadsData || []).map((l) => [l.id, l])
      );
      const messageMap = new Map(
        (lastMessages || []).map((m) => [m.lead_id, m])
      );

      const rows: ResponseRow[] = respData
        .map((r) => {
          const lead = leadMap.get(r.lead_id);
          const msg = messageMap.get(r.lead_id);
          if (!lead) return null;
          return {
            ...r,
            category: lead.category,
            location_text: lead.location_text,
            lead_status: lead.status,
            last_message: msg?.message || null,
            last_message_time: msg?.created_at || null,
          };
        })
        .filter(Boolean) as ResponseRow[];

      setResponses(rows);
      setLoading(false);
    };

    fetchResponses();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-medium">Loading responses…</p>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">No quotes sent yet</h2>
        <p className="text-muted-foreground max-w-xs">
          When you send quotes to leads, they'll appear here so you can track them.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {responses.map((resp) => {
        const badge = statusBadge[resp.status] || statusBadge.sent;
        return (
          <Card
            key={resp.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform"
            onClick={() => navigate(`/app/leads/${resp.lead_id}`)}
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-foreground">{resp.category}</h3>
              <Badge variant="outline" className={`text-xs ${badge.className}`}>
                {badge.label}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {resp.message}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              {(resp.price_min !== null || resp.price_max !== null) && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <PoundSterling className="h-3 w-3" />
                  {resp.price_min !== null && resp.price_max !== null
                    ? `£${resp.price_min} – £${resp.price_max}`
                    : resp.price_min !== null
                    ? `From £${resp.price_min}`
                    : `Up to £${resp.price_max}`}
                </span>
              )}
              {resp.availability && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  {availabilityLabels[resp.availability] || resp.availability}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {resp.location_text}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(resp.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {resp.last_message && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 italic">
                Last: {resp.last_message}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
