import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StatusDropdown from "@/components/lead-detail/StatusDropdown";
import type { CustomStatus } from "@/hooks/useCustomStatuses";
import { formatDistanceToNow } from "date-fns";

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

function getInitial(name: string | null) {
  return name?.charAt(0).toUpperCase() || "?";
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

  const timeAgo = formatDistanceToNow(new Date(lead.created_at), {
    addSuffix: false,
  });

  return (
    <>
      {/* ── Dark top bar ── */}
      <div className="bg-[hsl(210,30%,20%)] text-white">
        {/* Nav row */}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/app/leads")}
            className="flex items-center gap-1 text-white/90 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <StatusDropdown
              statuses={customStatuses}
              currentStatusId={customStatusId}
              leadId={lead.id}
              onStatusChanged={onCustomStatusChanged}
            />
            <button
              onClick={onPass || onArchiveToggle}
              className="text-white font-semibold text-sm"
            >
              {isArchived ? "Restore" : "Pass"}
            </button>
          </div>
        </div>

        {/* Customer info in dark area (Bark-style) */}
        <div className="px-4 pb-4 flex items-start gap-3.5">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-[hsl(260,40%,70%)] flex items-center justify-center text-white text-lg font-bold shrink-0">
            {getInitial(lead.customer_name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white truncate">
                {lead.customer_name || "Customer"}
              </h2>
              <Badge className="bg-[hsl(160,60%,40%)] text-white border-0 text-xs shrink-0 whitespace-nowrap">
                {timeAgo} ago
              </Badge>
            </div>
            <p className="text-sm text-white/70 mt-0.5">
              {lead.location_text}
            </p>
            <p className="text-sm text-white/70">
              {lead.category}
            </p>
          </div>
        </div>
      </div>

      {/* Archived notice */}
      {isArchived && (
        <div className="px-4 py-2 bg-muted">
          <p className="text-xs font-medium text-muted-foreground text-center">
            This lead is archived
          </p>
        </div>
      )}
    </>
  );
}
