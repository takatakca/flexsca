import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, SlidersHorizontal } from "lucide-react";
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { statuses } = useCustomStatuses();

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

  return (
    <div className="max-w-7xl mx-auto pb-8 md:p-4 lg:p-6">
      {/* ── Header bar ── */}
      <div className="mx-4 mt-4 rounded-2xl bg-white border border-border px-4 py-3 flex items-center gap-3">
        {/* Count */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">
            {total} Matching lead{total !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {showArchived ? "Your archived requests" : "Available requests"}
          </p>
        </div>

        {/* Filter button */}
        <button
          aria-label="Filter requests"
          onClick={() => setFiltersOpen(true)}
          className={`relative flex items-center justify-center h-10 w-10 rounded-full border transition-colors ${
            activeFilterCount > 0
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>

        <Button variant="outline" onClick={() => { setShowArchived(v => !v); setPage(0); }}>
          {showArchived ? "Available" : "Archived"}
        </Button>
      </div>

      {/* ── Lead cards ── */}
      <div className="px-4 mt-4 grid lg:grid-cols-2 gap-4">
        {loading ? (
          <div role="status" className="flex justify-center gap-2 py-8"><Loader2 className="h-5 w-5 animate-spin" /> Loading requests…</div>
        ) : error ? (
          <div role="alert" className="rounded-xl border p-5 text-center space-y-3">
            <p>{error}</p><Button onClick={() => setRefresh(v => v + 1)}>Try again</Button>
          </div>
        ) : leads.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No leads match your filters.
          </p>
        ) : (
          leads.map((lead) => {
            const state = agentStates.get(lead.id);
            return (
              <LeadCard
                key={lead.id}
                lead={lead}
                state={state ?? null}
                showArchived={showArchived}
                onNavigate={() => navigate(`/app/leads/${lead.id}`)}
                onRestore={handleRestore}
                onLongPress={() => setReminderLead(lead)}
              />
            );
          })
        )}
      </div>

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
