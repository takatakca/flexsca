import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ClipboardList, SlidersHorizontal, LayoutList, MapPin as MapIcon } from "lucide-react";
import { isAfter, subHours, subDays, subWeeks, startOfDay } from "date-fns";
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
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filters, setFilters] = useState<LeadsFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reminderLead, setReminderLead] = useState<Lead | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { statuses } = useCustomStatuses();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [leadsRes, statesRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id, category, location_text, customer_name, customer_phone, details, status, created_at, last_activity_at, credits_cost, is_urgent, has_additional_details, city, postal_code, answers")
          .order("last_activity_at", { ascending: false }),
        supabase
          .from("lead_agent_state")
          .select("lead_id, is_unread, is_archived, contacted, first_to_respond, custom_status_id")
          .eq("agent_id", user.id),
      ]);

      if (leadsRes.data) {
        setLeads(
          leadsRes.data.map((l) => ({
            ...l,
            answers: (l.answers as Record<string, unknown>) ?? {},
          }))
        );
      }
      if (statesRes.data) {
        setAgentStates(new Map(statesRes.data.map((s) => [s.lead_id, s])));
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleRestore = async (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("lead_agent_state")
      .update({ is_archived: false, archived_at: null, updated_at: new Date().toISOString() })
      .eq("lead_id", leadId)
      .eq("agent_id", user!.id);

    if (!error) {
      setAgentStates((prev) => {
        const next = new Map(prev);
        const existing = next.get(leadId);
        if (existing) next.set(leadId, { ...existing, is_archived: false });
        return next;
      });
      toast.success("Lead restored");
    } else {
      toast.error("Failed to restore lead");
    }
  };

  const filteredLeads = useMemo(() => {
    let result = leads;

    // Archive filter
    result = result.filter((l) => {
      const state = agentStates.get(l.id);
      const isArchived = state?.is_archived ?? false;
      return showArchived ? isArchived : !isArchived;
    });

    // Keyword
    if (filters.keyword.trim()) {
      const q = filters.keyword.toLowerCase();
      result = result.filter(
        (l) =>
          l.category.toLowerCase().includes(q) ||
          l.location_text.toLowerCase().includes(q) ||
          (l.customer_name && l.customer_name.toLowerCase().includes(q)) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }

    // Services
    if (filters.services.length > 0) {
      result = result.filter((l) => filters.services.includes(l.category));
    }

    // Credits
    if (filters.credits.length > 0) {
      result = result.filter((l) => filters.credits.includes(l.credits_cost));
    }

    // Urgent
    if (filters.urgentOnly) {
      result = result.filter((l) => l.is_urgent);
    }

    // Has additional details
    if (filters.hasAdditionalDetails) {
      result = result.filter((l) => l.has_additional_details);
    }

    // Unread only
    if (filters.unreadOnly) {
      result = result.filter((l) => {
        const state = agentStates.get(l.id);
        return state?.is_unread ?? true;
      });
    }

    // First to respond
    if (filters.firstToRespondOnly) {
      result = result.filter((l) => {
        const state = agentStates.get(l.id);
        return state?.first_to_respond ?? false;
      });
    }

    // Status filter
    if (filters.statusIds.length > 0) {
      result = result.filter((l) => {
        const state = agentStates.get(l.id);
        return state?.custom_status_id ? filters.statusIds.includes(state.custom_status_id) : false;
      });
    }

    // Time range filter
    if (filters.timeRange && filters.timeRange !== "any") {
      const now = new Date();
      let cutoff: Date | null = null;
      switch (filters.timeRange) {
        case "last_hour": cutoff = subHours(now, 1); break;
        case "today": cutoff = startOfDay(now); break;
        case "yesterday": cutoff = subDays(startOfDay(now), 1); break;
        case "3_days": cutoff = subDays(now, 3); break;
        case "7_days": cutoff = subDays(now, 7); break;
        case "2_weeks": cutoff = subWeeks(now, 2); break;
      }
      if (cutoff) {
        result = result.filter((l) => isAfter(new Date(l.created_at), cutoff));
      }
    }

    return result;
  }, [leads, agentStates, showArchived, filters]);

  // Compute summary stats for the header
  const serviceCount = useMemo(() => {
    const services = new Set(filteredLeads.map((l) => l.category));
    return services.size;
  }, [filteredLeads]);

  const locationCount = useMemo(() => {
    const locations = new Set(filteredLeads.map((l) => l.city || l.location_text));
    return locations.size;
  }, [filteredLeads]);

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
    ].filter(Boolean).length;
  }, [filters]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground font-medium">Loading leads…</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 px-6 text-center">
        <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-4">
          <ClipboardList className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">No leads yet</h2>
        <p className="text-muted-foreground max-w-xs">
          When customers request your services, their leads will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* ── Header bar ── */}
      <div className="mx-4 mt-4 rounded-2xl bg-accent/60 border border-border px-4 py-3 flex items-center gap-3">
        {/* Count */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">
            {filteredLeads.length} Matching lead{filteredLeads.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {serviceCount} service{serviceCount !== 1 ? "s" : ""} • {locationCount} location{locationCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filter button */}
        <button
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

        {/* List/Map toggle */}
        <button
          onClick={() => setViewMode((v) => v === "list" ? "map" : "list")}
          className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          {viewMode === "list" ? (
            <>
              <Map className="h-4 w-4" />
              Map
            </>
          ) : (
            <>
              <LayoutList className="h-4 w-4" />
              List
            </>
          )}
        </button>
      </div>

      {/* ── Lead cards ── */}
      <div className="px-4 mt-4 space-y-3">
        {filteredLeads.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No leads match your filters.
          </p>
        ) : (
          filteredLeads.map((lead) => {
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

      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onChange={setFilters}
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
