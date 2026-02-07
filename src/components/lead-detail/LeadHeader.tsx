import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Archive,
  ArchiveRestore,
  ChevronDown,
  Coins,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const statusColors: Record<string, string> = {
  new: "bg-primary text-primary-foreground",
  contacted: "bg-warning text-warning-foreground",
  won: "bg-success text-success-foreground",
  lost: "bg-destructive text-destructive-foreground",
};

const statusOptions = ["new", "contacted", "won", "lost"] as const;

interface LeadHeaderProps {
  lead: Lead;
  isContacted: boolean;
  isArchived: boolean;
  onStatusChange: (status: string) => void;
  onArchiveToggle: () => void;
}

export default function LeadHeader({
  lead,
  isContacted,
  isArchived,
  onStatusChange,
  onArchiveToggle,
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  statusColors[lead.status] || "bg-muted text-foreground"
                }`}
              >
                {lead.status}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusOptions.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={lead.status === s ? "font-bold" : ""}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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

        {/* Contact info only visible when contacted */}
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
