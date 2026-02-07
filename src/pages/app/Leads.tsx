import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin, Clock, ClipboardList, Search, X, Archive, Lock, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Lead {
  id: string;
  category: string;
  location_text: string;
  customer_name: string | null;
  details: string | null;
  status: string;
  created_at: string;
  last_activity_at: string;
  archived: boolean;
}

interface PricingRule {
  category: string;
  base_cost: number;
}

const statusColors: Record<string, string> = {
  new: "bg-primary text-primary-foreground",
  contacted: "bg-warning text-warning-foreground",
  won: "bg-success text-success-foreground",
  lost: "bg-destructive text-destructive-foreground",
};

const statusFilters = ["all", "new", "contacted", "won", "lost"] as const;

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [purchasedLeadIds, setPurchasedLeadIds] = useState<Set<string>>(new Set());
  const [pricingMap, setPricingMap] = useState<Map<string, number>>(new Map());
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [leadsRes, purchasesRes, pricingRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id, category, location_text, customer_name, details, status, created_at, last_activity_at, archived")
          .eq("archived", showArchived)
          .order("last_activity_at", { ascending: false }),
        supabase
          .from("lead_purchases")
          .select("lead_id")
          .eq("user_id", user.id),
        supabase
          .from("lead_pricing_rules")
          .select("category, base_cost"),
      ]);

      if (leadsRes.data) setLeads(leadsRes.data);
      if (purchasesRes.data) {
        setPurchasedLeadIds(new Set(purchasesRes.data.map((p) => p.lead_id)));
      }
      if (pricingRes.data) {
        setPricingMap(new Map(pricingRes.data.map((r) => [r.category, r.base_cost])));
      }
      setLoading(false);
    };

    fetchData();
  }, [user, showArchived]);

  const handleRestore = async (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("leads")
      .update({ archived: false, archived_at: null })
      .eq("id", leadId);

    if (!error) {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      toast.success("Lead restored");
    } else {
      toast.error("Failed to restore lead");
    }
  };

  const filteredLeads = useMemo(() => {
    let result = leads;

    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.category.toLowerCase().includes(q) ||
          l.location_text.toLowerCase().includes(q) ||
          (l.customer_name && l.customer_name.toLowerCase().includes(q)) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }

    return result;
  }, [leads, statusFilter, searchQuery]);

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
      <div className="flex rounded-full bg-muted p-1">
        <button
          onClick={() => { setShowArchived(false); setLoading(true); }}
          className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
            !showArchived ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => { setShowArchived(true); setLoading(true); }}
          className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
            showArchived ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Archived
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 rounded-full h-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status filter chips */}
      {!showArchived && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Lead cards */}
      {filteredLeads.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">
          No leads match your filters.
        </p>
      ) : (
        filteredLeads.map((lead) => {
          const isPurchased = purchasedLeadIds.has(lead.id);
          const leadCost = pricingMap.get(lead.category) ?? 5;

          return (
            <Card
              key={lead.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform"
              onClick={() => navigate(`/app/leads/${lead.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground">{lead.category}</h3>
                <div className="flex items-center gap-1.5">
                  {/* Credit badge */}
                  {!showArchived && (
                    isPurchased ? (
                      <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        <Coins className="h-3 w-3 mr-0.5" />
                        {leadCost}
                      </Badge>
                    )
                  )}
                  <Badge className={`text-xs ${statusColors[lead.status] || ""}`}>
                    {lead.status}
                  </Badge>
                </div>
              </div>

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

              {lead.customer_name && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Customer: {lead.customer_name}
                </p>
              )}

              {showArchived && (
                <button
                  onClick={(e) => handleRestore(e, lead.id)}
                  className="mt-2 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  <Archive className="h-3.5 w-3.5" /> Restore
                </button>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
