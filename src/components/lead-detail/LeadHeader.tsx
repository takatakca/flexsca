import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Archive,
  ArchiveRestore,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StatusDropdown from "@/components/lead-detail/StatusDropdown";
import type { CustomStatus } from "@/hooks/useCustomStatuses";

interface Lead {
  id: string;
  category: string;
  location_text: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  details: string | null;
  status: string;
  credits_cost: number;
  is_urgent: boolean;
  city: string | null;
  postal_code: string | null;
  created_at: string;
}

interface LeadHeaderProps {
  lead: Lead;
  isContacted: boolean;
  isArchived: boolean;
  customStatusId: string | null;
  customStatuses: CustomStatus[];
  onArchiveToggle: () => void;
  onCustomStatusChanged: (statusId: string) => void;
  onPass?: () => void;
}

export default function LeadHeader({
  lead,
  isContacted,
  isArchived,
  customStatusId,
  customStatuses,
  onArchiveToggle,
  onCustomStatusChanged,
  onPass,
}: LeadHeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Dark top bar (Bark-style) ── */}
      <div className="bg-[hsl(210,30%,20%)] text-white px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate("/app/leads")}
          className="flex items-center gap-1 text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          {/* Status dropdown */}
          <StatusDropdown
            statuses={customStatuses}
            currentStatusId={customStatusId}
            leadId={lead.id}
            onStatusChanged={onCustomStatusChanged}
          />

          {/* Archive / Pass */}
          <button
            onClick={onPass || onArchiveToggle}
            className="text-white font-semibold text-sm"
          >
            {isArchived ? "Restore" : "Pass"}
          </button>
        </div>
      </div>

      {/* ── Lead info section ── */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1.5">
          <h2 className="text-lg font-bold text-foreground">{lead.category}</h2>
          {lead.is_urgent && (
            <Badge variant="destructive" className="text-xs">
              <Zap className="h-3 w-3 mr-0.5" /> Urgent
            </Badge>
          )}
        </div>

        {lead.customer_name && (
          <p className="text-sm font-medium text-foreground mb-1">
            {lead.customer_name}
          </p>
        )}

        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
          <MapPin className="h-3.5 w-3.5" /> {lead.location_text}
        </p>

        {isContacted && lead.customer_phone && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
            <Phone className="h-3.5 w-3.5" />
            <a href={`tel:${lead.customer_phone}`} className="text-primary hover:underline">
              {lead.customer_phone}
            </a>
          </p>
        )}
        {isContacted && lead.customer_email && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            <a href={`mailto:${lead.customer_email}`} className="text-primary hover:underline">
              {lead.customer_email}
            </a>
          </p>
        )}

        {isArchived && (
          <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
            This lead is archived
          </div>
        )}
      </div>
    </>
  );
}
