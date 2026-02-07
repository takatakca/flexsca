import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Archive,
  ArchiveRestore,
  Coins,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

export default function LeadHeader({
  lead,
  isContacted,
  isArchived,
  customStatusId,
  customStatuses,
  onArchiveToggle,
  onCustomStatusChanged,
}: LeadHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="border-b p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigate("/app/leads")}
          className="flex items-center gap-1 text-sm text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onArchiveToggle}
          >
            {isArchived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </Button>

          {/* Custom status dropdown */}
          <StatusDropdown
            statuses={customStatuses}
            currentStatusId={customStatusId}
            leadId={lead.id}
            onStatusChanged={onCustomStatusChanged}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-bold text-foreground">{lead.category}</h2>
        {lead.is_urgent && (
          <Badge variant="destructive" className="text-xs">
            <Zap className="h-3 w-3 mr-0.5" /> Urgent
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3 mb-2">
        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
          <Coins className="h-3 w-3 mr-0.5" />
          {lead.credits_cost} Credits
        </Badge>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> {lead.location_text}
        </p>
        {lead.customer_name && <p>Customer: {lead.customer_name}</p>}

        {isContacted && lead.customer_phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-4 w-4" />
            <a href={`tel:${lead.customer_phone}`} className="text-primary hover:underline">
              {lead.customer_phone}
            </a>
          </p>
        )}
        {isContacted && lead.customer_email && (
          <p className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            <a href={`mailto:${lead.customer_email}`} className="text-primary hover:underline">
              {lead.customer_email}
            </a>
          </p>
        )}
      </div>

      {isArchived && (
        <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          This lead is archived
        </div>
      )}
    </div>
  );
}
