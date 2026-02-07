import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2, MapPin, Clock, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomStatuses, type CustomStatus } from "@/hooks/useCustomStatuses";
import { formatDistanceToNow } from "date-fns";

interface ContactedLead {
  id: string;
  category: string;
  location_text: string;
  customer_name: string | null;
  details: string | null;
  created_at: string;
  credits_cost: number;
  // From agent state
  contacted_at: string | null;
  custom_status_id: string | null;
  // Last message
  last_message: string | null;
  last_message_time: string | null;
}

const categoryFilters = ["all", "pending", "hired", "archived"] as const;

export default function Responses() {
  const [leads, setLeads] = useState<ContactedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { statuses, loading: statusesLoading } = useCustomStatuses();

  useEffect(() => {
    if (!user) return;

    const fetchContactedLeads = async () => {
      // Get all leads where agent has contacted
      const { data: stateData } = await supabase
        .from("lead_agent_state")
        .select("lead_id, contacted_at, custom_status_id")
        .eq("agent_id", user.id)
        .eq("contacted", true);

      if (!stateData || stateData.length === 0) {
        setLoading(false);
        return;
      }

      const leadIds = stateData.map((s) => s.lead_id);
      const stateMap = new Map(stateData.map((s) => [s.lead_id, s]));

      // Fetch lead details
      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, category, location_text, customer_name, details, created_at, credits_cost")
        .in("id", leadIds);

      // Fetch last messages
      const { data: lastMessages } = await supabase
        .from("lead_last_message")
        .select("lead_id, message, created_at")
        .in("lead_id", leadIds);

      const messageMap = new Map(
        (lastMessages || []).map((m) => [m.lead_id, m])
      );

      const rows: ContactedLead[] = (leadsData || []).map((l) => {
        const state = stateMap.get(l.id);
        const msg = messageMap.get(l.id);
        return {
          ...l,
          contacted_at: state?.contacted_at || null,
          custom_status_id: state?.custom_status_id || null,
          last_message: msg?.message || null,
          last_message_time: msg?.created_at || null,
        };
      });

      // Sort by most recently contacted
      rows.sort((a, b) => {
        const ta = a.contacted_at ? new Date(a.contacted_at).getTime() : 0;
        const tb = b.contacted_at ? new Date(b.contacted_at).getTime() : 0;
        return tb - ta;
      });

      setLeads(rows);
      setLoading(false);
    };

    fetchContactedLeads();
  }, [user]);

  const statusMap = useMemo(
    () => new Map(statuses.map((s) => [s.id, s])),
    [statuses]
  );

  const filteredLeads = useMemo(() => {
    if (categoryFilter === "all") return leads;

    return leads.filter((l) => {
      const status = l.custom_status_id ? statusMap.get(l.custom_status_id) : null;
      return status?.category === categoryFilter;
    });
  }, [leads, categoryFilter, statusMap]);

  if (loading || statusesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-medium">Loading responses…</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">No responses yet</h2>
        <p className="text-muted-foreground max-w-xs">
          When you contact leads, they'll appear here so you can track conversations.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categoryFilters.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              categoryFilter === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {filteredLeads.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">
          No leads in this category.
        </p>
      ) : (
        filteredLeads.map((lead) => {
          const status = lead.custom_status_id
            ? statusMap.get(lead.custom_status_id)
            : null;

          return (
            <Card
              key={lead.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform"
              onClick={() => navigate(`/app/leads/${lead.id}`)}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-foreground">{lead.category}</h3>
                {status && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: status.color,
                      color: status.color,
                      backgroundColor: `${status.color}15`,
                    }}
                  >
                    <Circle className="h-2 w-2 mr-1 fill-current" />
                    {status.name}
                  </Badge>
                )}
              </div>

              {lead.customer_name && (
                <p className="text-sm text-foreground mb-1">{lead.customer_name}</p>
              )}

              {lead.last_message && (
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2 italic">
                  {lead.last_message}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {lead.location_text}
                </span>
                {lead.contacted_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(lead.contacted_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
