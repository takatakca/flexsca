import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Loader2,
  MapPin,
  Clock,
  Circle,
  Pencil,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("pending");
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { statuses, loading: statusesLoading, byCategory } = useCustomStatuses();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowStatusPicker(false);
      }
    };
    if (showStatusPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showStatusPicker]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    setLoading(true);
    setError(false);
    const fetchContactedLeads = async () => {
      try {
      const { data: stateData, error: stateError } = await supabase
        .from("lead_agent_state")
        .select("lead_id, contacted_at, custom_status_id")
        .eq("agent_id", user.id)
        .eq("contacted", true);

      if (stateError) throw stateError;
      if (!stateData || stateData.length === 0) {
        if (active) setLeads([]);
        return;
      }

      const leadIds = stateData.map((s) => s.lead_id);
      const stateMap = new Map(stateData.map((s) => [s.lead_id, s]));

      const { data: leadsData, error: leadsError } = await supabase
        .from("leads_safe")
        .select(
          "id, category, location_text, customer_name, details, created_at, credits_cost"
        )
        .in("id", leadIds);

      const { data: lastMessages, error: messagesError } = await supabase
        .from("lead_last_message")
        .select("lead_id, message, created_at")
        .in("lead_id", leadIds);

      if (leadsError || messagesError) throw leadsError || messagesError;
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

      if (active) setLeads(rows);
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    };

    void fetchContactedLeads();
    return () => { active = false; };
  }, [user, refresh]);

  const statusMap = useMemo(
    () => new Map(statuses.map((s) => [s.id, s])),
    [statuses]
  );

  // Get default status for the active category filter (first status in that category)
  const defaultCategoryStatus = useMemo(() => {
    const catStatuses = byCategory(activeCategoryFilter);
    return catStatuses.length > 0 ? catStatuses[0] : null;
  }, [activeCategoryFilter, byCategory]);

  // Determine the pill color and label
  const activeStatus = activeStatusId ? statusMap.get(activeStatusId) : null;
  const pillColor = activeStatus?.color || defaultCategoryStatus?.color || "#F59E0B";
  const pillLabel = activeStatus?.name || activeCategoryFilter.charAt(0).toUpperCase() + activeCategoryFilter.slice(1);

  // Filter leads by active status or by category
  const filteredLeads = useMemo(() => {
    if (activeStatusId) {
      return leads.filter((l) => l.custom_status_id === activeStatusId);
    }
    // Filter by category
    return leads.filter((l) => {
      const status = l.custom_status_id ? statusMap.get(l.custom_status_id) : null;
      return (status?.category ?? "pending") === activeCategoryFilter;
    });
  }, [leads, activeStatusId, activeCategoryFilter, statusMap]);

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

  if (error) return <div role="alert" className="p-6 space-y-4 text-center"><p>Unable to load your conversations. Please try again.</p><Button onClick={() => setRefresh(v => v + 1)}>Retry conversations</Button></div>;

  return (
    <div>
      {/* ── Full-width status pill ── */}
      <div className="px-4 pt-3 pb-1 relative" ref={dropdownRef}>
        <button
          onClick={() => setShowStatusPicker(!showStatusPicker)}
          className="w-full rounded-xl py-3.5 px-5 flex items-center justify-between text-white font-semibold text-base shadow-sm transition-transform active:scale-[0.98]"
          style={{ backgroundColor: pillColor }}
        >
          <span>{pillLabel}</span>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${
              showStatusPicker ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        {showStatusPicker && (
          <Card className="absolute left-4 right-4 top-full mt-1 z-20 rounded-2xl shadow-lg border border-border overflow-hidden">
            <div className="h-1.5 w-full" style={{ backgroundColor: pillColor }} />

            <div className="p-4 space-y-4">
              {/* Pending */}
              {pending.length > 0 && (
                <StatusFilterGroup
                  title="Pending statuses"
                  statuses={pending}
                  activeStatusId={activeStatusId}
                  onSelect={(id) => {
                    setActiveStatusId(id);
                    setActiveCategoryFilter("pending");
                    setShowStatusPicker(false);
                  }}
                  onSelectCategory={() => {
                    setActiveStatusId(null);
                    setActiveCategoryFilter("pending");
                    setShowStatusPicker(false);
                  }}
                  isCategoryActive={!activeStatusId && activeCategoryFilter === "pending"}
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
                      setActiveCategoryFilter("hired");
                      setShowStatusPicker(false);
                    }}
                    onSelectCategory={() => {
                      setActiveStatusId(null);
                      setActiveCategoryFilter("hired");
                      setShowStatusPicker(false);
                    }}
                    isCategoryActive={!activeStatusId && activeCategoryFilter === "hired"}
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
                      setActiveCategoryFilter("archived");
                      setShowStatusPicker(false);
                    }}
                    onSelectCategory={() => {
                      setActiveStatusId(null);
                      setActiveCategoryFilter("archived");
                      setShowStatusPicker(false);
                    }}
                    isCategoryActive={!activeStatusId && activeCategoryFilter === "archived"}
                  />
                </>
              )}

              {/* Create / Manage link */}
              <div className="border-t border-border pt-3">
                <button
                  onClick={() => navigate("/app/settings/statuses")}
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

      {/* ── Content area ── */}
      {filteredLeads.length === 0 ? (
        <EmptyResponsesState onViewLeads={() => navigate("/app/leads")} />
      ) : (
        <div className="px-4 pt-3 pb-4 space-y-3">
          {filteredLeads.map((lead) => {
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
                  <h3 className="font-semibold text-foreground">
                    {lead.category}
                  </h3>
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
                  <p className="text-sm text-foreground mb-1">
                    {lead.customer_name}
                  </p>
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
          })}

          {/* View leads link at bottom */}
          <button
            onClick={() => navigate("/app/leads")}
            className="w-full text-center text-sm font-bold text-foreground py-3"
          >
            View leads
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Empty state ── */

function EmptyResponsesState({ onViewLeads }: { onViewLeads: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {/* Search/document illustration */}
      <div className="relative mb-6">
        <div className="w-28 h-20 rounded-lg bg-muted/60 flex flex-col items-start justify-center pl-4 gap-1.5">
          <div className="h-2 w-14 rounded-full bg-muted-foreground/20" />
          <div className="h-2 w-10 rounded-full bg-muted-foreground/15" />
          <div className="h-2 w-12 rounded-full bg-muted-foreground/10" />
        </div>
        <div className="absolute -bottom-2 -left-2 h-10 w-10 rounded-full bg-muted/80 flex items-center justify-center">
          <Search className="h-5 w-5 text-muted-foreground/40" />
        </div>
        <div className="absolute -top-1 -right-2 w-8 h-10 rounded bg-muted/40" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-3">No responses</h2>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mb-6">
        You haven't responded to any customers yet. When you do, you'll be able
        to contact and access their details here.
      </p>

      <button
        onClick={onViewLeads}
        className="text-sm font-bold text-foreground"
      >
        View leads
      </button>
    </div>
  );
}

/* ── Status filter group (inside dropdown) ── */

function StatusFilterGroup({
  title,
  statuses,
  activeStatusId,
  onSelect,
  onSelectCategory,
  isCategoryActive,
}: {
  title: string;
  statuses: CustomStatus[];
  activeStatusId: string | null;
  onSelect: (id: string) => void;
  onSelectCategory: () => void;
  isCategoryActive: boolean;
}) {
  return (
    <div>
      <button
        onClick={onSelectCategory}
        className={`text-sm font-bold mb-2 ${
          isCategoryActive ? "text-primary" : "text-foreground"
        }`}
      >
        {title}
      </button>
      <div className="space-y-1">
        {statuses.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeStatusId === s.id
                ? "bg-accent text-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <div
              className="h-5 w-5 rounded shrink-0"
              style={{ backgroundColor: s.color }}
            />
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
