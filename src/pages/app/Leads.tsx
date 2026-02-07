import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin, Clock, ClipboardList, Search, X, Archive, Coins, Zap, SlidersHorizontal, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomStatuses } from "@/hooks/useCustomStatuses";
import { useLongPress } from "@/hooks/useLongPress";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import FiltersSheet, { type LeadsFilters, defaultFilters } from "@/components/leads/FiltersSheet";
import ReminderModal from "@/components/leads/ReminderModal";

interface Lead {
  id: string;
  category: string;
  location_text: string;
  customer_name: string | null;
  details: string | null;
  status: string;
  created_at: string;
  last_activity_at: string;
  credits_cost: number;
  is_urgent: boolean;
  has_additional_details: boolean;
  city: string | null;
  postal_code: string | null;
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
          .select("id, category, location_text, customer_name, details, status, created_at, last_activity_at, credits_cost, is_urgent, has_additional_details, city, postal_code")
          .order("last_activity_at", { ascending: false }),
        supabase
          .from("lead_agent_state")
          .select("lead_id, is_unread, is_archived, contacted, first_to_respond, custom_status_id")
          .eq("agent_id", user.id),
      ]);

      if (leadsRes.data) setLeads(leadsRes.data);
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

  const statusMap = useMemo(() => new Map(statuses.map((s) => [s.id, s])), [statuses]);

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

    return result;
  }, [leads, agentStates, showArchived, filters]);

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
    <div className="p-4 space-y-3">
      {/* Active / Archived toggle */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-full bg-muted p-1">
          <button
            onClick={() => setShowArchived(false)}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
              !showArchived ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
              showArchived ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Archived
          </button>
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className={`relative flex items-center gap-1 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
            activeFilterCount > 0
              ? "border-primary text-primary bg-primary/5"
              : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
      </p>

      {/* Lead cards */}
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
              statusMap={statusMap}
              showArchived={showArchived}
              onNavigate={() => navigate(`/app/leads/${lead.id}`)}
              onRestore={handleRestore}
              onLongPress={() => setReminderLead(lead)}
            />
          );
        })
      )}

      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onChange={setFilters}
        customStatuses={statuses}
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

function LeadCard({
  lead,
  state,
  statusMap,
  showArchived,
  onNavigate,
  onRestore,
  onLongPress,
}: {
  lead: Lead;
  state: AgentState | null;
  statusMap: Map<string, { name: string; color: string; category: string }>;
  showArchived: boolean;
  onNavigate: () => void;
  onRestore: (e: React.MouseEvent, id: string) => void;
  onLongPress: () => void;
}) {
  const isUnread = state?.is_unread ?? true;
  const isContacted = state?.contacted ?? false;
  const customStatus = state?.custom_status_id ? statusMap.get(state.custom_status_id) : null;

  const longPressHandlers = useLongPress({
    onLongPress,
    onClick: onNavigate,
  });

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform select-none"
      {...longPressHandlers}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {isUnread && !showArchived && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
          <h3 className="font-semibold text-foreground truncate">{lead.category}</h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {lead.is_urgent && (
            <Badge variant="destructive" className="text-xs">
              <Zap className="h-3 w-3 mr-0.5" /> Urgent
            </Badge>
          )}
          {customStatus && (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                borderColor: customStatus.color,
                color: customStatus.color,
                backgroundColor: `${customStatus.color}15`,
              }}
            >
              <Circle className="h-2 w-2 mr-1 fill-current" />
              {customStatus.name}
            </Badge>
          )}
          {!showArchived && !isContacted && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              <Coins className="h-3 w-3 mr-0.5" />
              {lead.credits_cost}
            </Badge>
          )}
        </div>
      </div>

      {lead.customer_name && (
        <p className="text-sm font-medium text-foreground mb-1">{lead.customer_name}</p>
      )}

      {lead.details && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {lead.details}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {lead.location_text}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
        </span>
      </div>

      {showArchived && (
        <button
          onClick={(e) => onRestore(e, lead.id)}
          className="mt-2 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          <Archive className="h-3.5 w-3.5" /> Restore
        </button>
      )}
    </Card>
  );
}
