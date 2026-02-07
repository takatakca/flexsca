import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2, MapPin, Clock, Circle, Pencil } from "lucide-react";
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
  contacted_at: string | null;
  custom_status_id: string | null;
  last_message: string | null;
  last_message_time: string | null;
}

export default function Responses() {
  const [leads, setLeads] = useState<ContactedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { statuses, loading: statusesLoading, byCategory } = useCustomStatuses();

  useEffect(() => {
    if (!user) return;

    const fetchContactedLeads = async () => {
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

      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, category, location_text, customer_name, details, created_at, credits_cost")
        .in("id", leadIds);

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

  // Determine active status's category color for top accent bar
  const activeStatus = activeStatusId ? statusMap.get(activeStatusId) : null;

  const filteredLeads = useMemo(() => {
    if (!activeStatusId) return leads;
    return leads.filter((l) => l.custom_status_id === activeStatusId);
  }, [leads, activeStatusId]);

  const pending = byCategory("pending");
  const hired = byCategory("hired");
  const archived = byCategory("archived");

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
      {/* ── Bark-style status filter card ── */}
      <div className="relative">
        <button
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className="w-full rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
          style={{
            borderTopColor: activeStatus?.color || "hsl(var(--primary))",
            borderTopWidth: "4px",
          }}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeStatus ? (
                <>
                  <div
                    className="h-4 w-4 rounded-sm"
                    style={{ backgroundColor: activeStatus.color }}
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {activeStatus.name}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-foreground">
                  All statuses
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {showStatusPicker ? "▲" : "▼"}
            </span>
          </div>
        </button>

        {/* Dropdown card */}
        {showStatusPicker && (
          <Card className="absolute left-0 right-0 top-full mt-1 z-20 rounded-2xl shadow-lg border border-border overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{
                backgroundColor: activeStatus?.color || "hsl(var(--primary))",
              }}
            />

            <div className="p-4 space-y-4">
              {/* All option */}
              <button
                onClick={() => {
                  setActiveStatusId(null);
                  setShowStatusPicker(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !activeStatusId
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                All statuses
              </button>

              {/* Pending */}
              {pending.length > 0 && (
                <StatusFilterGroup
                  title="Pending statuses"
                  statuses={pending}
                  activeStatusId={activeStatusId}
                  onSelect={(id) => {
                    setActiveStatusId(id);
                    setShowStatusPicker(false);
                  }}
                />
              )}

              {/* Hired */}
              {hired.length > 0 && (
                <>
                  <div className="border-t border-border" />
                  <StatusFilterGroup
                    title="Hired statuses"
                    statuses={hired}
                    activeStatusId={activeStatusId}
                    onSelect={(id) => {
                      setActiveStatusId(id);
                      setShowStatusPicker(false);
                    }}
                  />
                </>
              )}

              {/* Archived */}
              {archived.length > 0 && (
                <>
                  <div className="border-t border-border" />
                  <StatusFilterGroup
                    title="Archived statuses"
                    statuses={archived}
                    activeStatusId={activeStatusId}
                    onSelect={(id) => {
                      setActiveStatusId(id);
                      setShowStatusPicker(false);
                    }}
                  />
                </>
              )}

              {/* Create / Manage link */}
              <div className="border-t border-border pt-3">
                <button
                  onClick={() => navigate("/app/status-management")}
                  className="flex items-center justify-center gap-2 w-full text-primary font-semibold text-sm hover:underline"
                >
                  <Pencil className="h-4 w-4" />
                  Create / Manage
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* View leads link */}
      <button
        onClick={() => navigate("/app/leads")}
        className="w-full text-center text-sm font-semibold text-foreground underline underline-offset-2"
      >
        View leads
      </button>

      {/* Lead cards */}
      {filteredLeads.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">
          No leads with this status.
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
                    {formatDistanceToNow(new Date(lead.contacted_at), {
                      addSuffix: true,
                    })}
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

/* ── Status filter group (inside dropdown) ── */

function StatusFilterGroup({
  title,
  statuses,
  activeStatusId,
  onSelect,
}: {
  title: string;
  statuses: CustomStatus[];
  activeStatusId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
      <div className="space-y-1">
        {statuses.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeStatusId === s.id
                ? "bg-accent text-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <div
              className="h-4 w-4 rounded-sm shrink-0"
              style={{ backgroundColor: s.color }}
            />
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
