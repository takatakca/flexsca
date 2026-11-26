import { lazy, Suspense, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { List, ListFilter, Loader2, Map as MapIcon, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Json } from "@/integrations/supabase/types";
import { errorMessage } from "@/lib/errors";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomStatuses } from "@/hooks/useCustomStatuses";
import { toast } from "sonner";
import FiltersSheet, { type LeadsFilters, defaultFilters } from "@/components/leads/FiltersSheet";
import ReminderModal from "@/components/leads/ReminderModal";
import LeadCard from "@/components/leads/LeadCard";

// The map library is only downloaded when the map view is opened.
const LeadsMap = lazy(() => import("@/components/leads/LeadsMap"));

interface Lead {
  id: string;
  category: string;
  location_text: string;
  customer_name: string | null;
  customer_phone: string | null;
  details: string | null;
  status: string;
  created_at: string;
  last_activity_at: string;
  credits_cost: number;
  is_urgent: boolean;
  has_additional_details: boolean;
  city: string | null;
  postal_code: string | null;
  answers: Record<string, unknown>;
}

interface AgentState {
  lead_id: string;
  is_unread: boolean;
  is_archived: boolean;
  contacted: boolean;
  first_to_respond: boolean;
  custom_status_id: string | null;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agentStates, setAgentStates] = useState<Map<string, AgentState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [options, setOptions] = useState({ services: [] as string[], credits: [] as number[] });
  const [filters, setFilters] = useState<LeadsFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reminderLead, setReminderLead] = useState<Lead | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [mapSelected, setMapSelected] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { statuses } = useCustomStatuses();

  // First visit of the session: the feed starts on the services the professional offers.
  // They can widen it at any time with the filter; the choice is then theirs for the session.
  const [scoped, setScoped] = useState(() => { try { return window.sessionStorage.getItem("flexs.feed-scoped") === "1"; } catch { return false; } });
  useEffect(() => {
    if (!user || scoped) return;
    let active = true;
    void Promise.all([
      supabase.from("provider_services").select("title").eq("user_id", user.id),
      supabase.from("service_categories").select("name").eq("is_active", true),
    ]).then(([mine, catalogue]) => {
      if (!active) return;
      const names = new Map((catalogue.data ?? []).map(row => [row.name.toLowerCase(), row.name]));
      const offered = [...new Set((mine.data ?? []).map(row => names.get(row.title.trim().toLowerCase())).filter((name): name is string => !!name))];
      if (offered.length > 0) setFilters(current => (current.services.length === 0 ? { ...current, services: offered } : current));
      try { window.sessionStorage.setItem("flexs.feed-scoped", "1"); } catch { /* the feed is simply scoped again next time */ }
      setScoped(true);
    }, () => setScoped(true));
    return () => { active = false; };
  }, [user, scoped]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const { data, error: requestError } = await supabase.rpc("search_marketplace_leads", {
          p_filters: { ...filters, archived: showArchived, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } as unknown as Json,
          p_page: page,
          p_page_size: 20,
        });
        if (requestError) throw requestError;
        const result = data as unknown as {
          leads: (Lead & AgentState)[]; total: number; services: string[]; credits: number[];
        };
        if (!result || !Array.isArray(result.leads) || !Number.isInteger(result.total)) {
          throw new Error("Invalid search response");
        }
        if (!active) return;
        setLeads(result.leads.map(l => ({ ...l, answers: l.answers ?? {} })));
        setAgentStates(new Map(result.leads.map(l => [l.id, { ...l, lead_id: l.id }])));
        setTotal(result.total);
        if (page > 0 && page * 20 >= result.total) setPage(Math.max(0, Math.ceil(result.total / 20) - 1));
        setOptions({ services: result.services, credits: result.credits });
      } catch (e) {
        if (active) setError(errorMessage(e, "Unable to load requests. Please try again."));
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchData();
    return () => { active = false; };
  }, [user, filters, showArchived, page, refresh]);

  const handleRestore = async (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("lead_agent_state")
      .update({ is_archived: false, archived_at: null, updated_at: new Date().toISOString() })
      .eq("lead_id", leadId)
      .eq("agent_id", user!.id);

    if (!error) {
      setRefresh(v => v + 1);
      toast.success("Lead restored");
    } else {
      toast.error("Failed to restore lead");
    }
  };

  const activeFilterCount = useMemo(() => {
    return [
      filters.unreadOnly,
      filters.hasAdditionalDetails,
      filters.urgentOnly,
      filters.firstToRespondOnly,
      filters.services.length > 0,
      filters.credits.length > 0,
      filters.statusIds.length > 0,
      filters.keyword.trim().length > 0,
      filters.timeRange !== "any",
    ].filter(Boolean).length;
  }, [filters]);

  // "2 services • 1 location": what the list is currently limited to.
  const towns = new Set(leads.map(l => l.city).filter(Boolean));
  const scopeLine = `${(filters.services.length || options.services.length)} service${(filters.services.length || options.services.length) === 1 ? "" : "s"} • ${towns.size} location${towns.size === 1 ? "" : "s"}`;

  return (
    <div className="max-w-7xl mx-auto pb-8 md:p-4 lg:p-6">
      {/* ── Header (frame 909:1102): count with the active scope, filter, then the List / Map switch ── */}
      <div className="mx-4 mt-4 flex items-center gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-fx-pill bg-white py-2 pl-5 pr-2 shadow-fx-card">
          <PencilLine className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base text-fx-ink">{total} Matching lead{total !== 1 ? "s" : ""}</p>
            <p className="truncate text-sm text-fx-secondary">{showArchived ? "Your archived requests" : scopeLine}</p>
          </div>
          <button aria-label="Filter requests" onClick={() => setFiltersOpen(true)}
            className={`relative grid size-11 shrink-0 place-items-center rounded-full border transition-colors ${activeFilterCount > 0 ? "border-primary bg-primary/10 text-primary" : "border-fx-line bg-white text-fx-ink hover:bg-fx-soft"}`}>
            <ListFilter className="size-5" aria-hidden="true" />
            {activeFilterCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">{activeFilterCount}</span>}
          </button>
        </div>
        <button type="button" aria-pressed={view === "map"} onClick={() => setView(v => (v === "map" ? "list" : "map"))}
          className="flex h-[52px] shrink-0 items-center gap-2 rounded-fx-pill bg-white px-5 text-base text-fx-ink shadow-fx-card">
          {view === "map" ? <><List className="size-4" aria-hidden="true" />List</> : <><MapIcon className="size-4" aria-hidden="true" />Map</>}
        </button>
      </div>
      <p className="mx-4 mt-2 text-right"><button type="button" className="text-sm text-primary hover:underline" onClick={() => { setShowArchived(v => !v); setPage(0); }}>{showArchived ? "Show available requests" : "Show archived requests"}</button></p>

      {loading ? (
        <div role="status" className="flex justify-center gap-2 py-8"><Loader2 className="h-5 w-5 animate-spin" /> Loading requests…</div>
      ) : error ? (
        <div role="alert" className="mx-4 mt-4 space-y-3 rounded-fx-sm border p-5 text-center"><p>{error}</p><Button onClick={() => setRefresh(v => v + 1)}>Try again</Button></div>
      ) : leads.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No leads match your filters.</p>
      ) : view === "map" ? (
        <div className="mt-3">
          <Suspense fallback={<div role="status" className="py-10 text-center text-sm text-fx-muted">Loading the map…</div>}>
            <LeadsMap leads={leads} selectedId={mapSelected} onSelect={id => { setMapSelected(id); document.getElementById(`map-card-${id}`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); }}>
              {leads.map(lead => (
                <div key={lead.id} id={`map-card-${lead.id}`} className="w-[min(390px,88vw)] shrink-0 snap-center" onFocus={() => setMapSelected(lead.id)} onMouseEnter={() => setMapSelected(lead.id)}>
                  <LeadCard lead={lead} state={agentStates.get(lead.id) ?? null} showArchived={showArchived} onNavigate={() => navigate(`/app/leads/${lead.id}`)} onRestore={handleRestore} onLongPress={() => setReminderLead(lead)} />
                </div>
              ))}
            </LeadsMap>
          </Suspense>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 px-2.5 lg:grid-cols-2">
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} state={agentStates.get(lead.id) ?? null} showArchived={showArchived}
              onNavigate={() => navigate(`/app/leads/${lead.id}`)} onRestore={handleRestore} onLongPress={() => setReminderLead(lead)} />
          ))}
        </div>
      )}

      {!loading && !error && total > 0 && (
        <nav aria-label="Request pages" className="flex items-center justify-center gap-4 px-4 mt-6">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage(v => v - 1)}>Previous</Button>
          <span aria-live="polite" className="text-sm">Page {page + 1} of {Math.ceil(total / 20)}</span>
          <Button variant="outline" disabled={(page + 1) * 20 >= total} onClick={() => setPage(v => v + 1)}>Next</Button>
        </nav>
      )}

      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onChange={(next) => { setFilters(next); setPage(0); }}
        remoteOptions={options}
        resultCount={total}
        customStatuses={statuses}
        leads={leads}
      />

      {reminderLead && (
        <ReminderModal
          open={!!reminderLead}
          onClose={() => setReminderLead(null)}
          leadId={reminderLead.id}
          leadCategory={reminderLead.category}
          customerName={reminderLead.customer_name}
        />
      )}
    </div>
  );
}
