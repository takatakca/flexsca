import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface Lead {
  id: string;
  category: string;
  location_text: string;
  customer_name: string | null;
  details: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  new: "bg-primary text-primary-foreground",
  contacted: "bg-warning text-warning-foreground",
  won: "bg-success text-success-foreground",
  lost: "bg-destructive text-destructive-foreground",
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, category, location_text, customer_name, details, status, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLeads(data);
      }
      setLoading(false);
    };

    fetchLeads();
  }, [user]);

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
      {leads.map((lead) => (
        <Card
          key={lead.id}
          className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform"
          onClick={() => navigate(`/app/leads/${lead.id}`)}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-foreground">{lead.category}</h3>
            <Badge className={`text-xs ${statusColors[lead.status] || ""}`}>
              {lead.status}
            </Badge>
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
        </Card>
      ))}
    </div>
  );
}

// Need to import for empty state
import { ClipboardList } from "lucide-react";
