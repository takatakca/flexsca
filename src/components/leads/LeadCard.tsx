import { useLongPress } from "@/hooks/useLongPress";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  ListChecks,
  Coins,
  Archive,
} from "lucide-react";

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
  answers?: Record<string, unknown>;
  customer_phone?: string | null;
}

interface AgentState {
  lead_id: string;
  is_unread: boolean;
  is_archived: boolean;
  contacted: boolean;
  first_to_respond: boolean;
  custom_status_id: string | null;
}

interface LeadCardProps {
  lead: Lead;
  state: AgentState | null;
  showArchived: boolean;
  onNavigate: () => void;
  onRestore: (e: React.MouseEvent, id: string) => void;
  onLongPress: () => void;
}

function getInitial(name: string | null) {
  return name?.charAt(0).toUpperCase() || "?";
}

function buildSummary(lead: Lead): string {
  const answers = lead.answers ?? {};
  const parts: string[] = [];

  // Pull short values from answers to build a summary line
  Object.values(answers).forEach((v) => {
    const str = String(v);
    if (str.length < 60) parts.push(str);
  });

  if (parts.length === 0 && lead.details) {
    return lead.details.slice(0, 100);
  }

  return parts.join(" / ") || lead.details?.slice(0, 100) || "";
}

export default function LeadCard({
  lead,
  state,
  showArchived,
  onNavigate,
  onRestore,
  onLongPress,
}: LeadCardProps) {
  const isUnread = state?.is_unread ?? true;
  const isContacted = state?.contacted ?? false;
  const firstToRespond = state?.first_to_respond ?? false;
  const hasVerifiedPhone = !!lead.customer_phone;
  const hasAdditionalDetails = lead.has_additional_details;

  const timeAgo = formatDistanceToNow(new Date(lead.created_at), {
    addSuffix: false,
  });

  const summary = buildSummary(lead);

  const longPressHandlers = useLongPress({
    onLongPress,
    onClick: onNavigate,
  });

  return (
    <div
      className="bg-card rounded-2xl border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform select-none overflow-hidden"
      {...longPressHandlers}
    >
      <div className="p-4">
        {/* Row 1: Avatar + Name + Time */}
        <div className="flex items-start gap-3">
          {/* Unread dot + Avatar */}
          <div className="relative shrink-0">
            {isUnread && !showArchived && (
              <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
            )}
            <div className="h-12 w-12 rounded-full bg-[hsl(260,40%,70%)] flex items-center justify-center text-white text-lg font-bold">
              {getInitial(lead.customer_name)}
            </div>
          </div>

          {/* Name + location */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-foreground truncate">
                {lead.customer_name || "Customer"}
              </h3>
              <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                {timeAgo} ago
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {[lead.city, lead.postal_code].filter(Boolean).join(", ") ||
                lead.location_text}
            </p>
          </div>
        </div>

        {/* Row 2: Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {hasVerifiedPhone && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
              Verified phone
            </span>
          )}
          {hasAdditionalDetails && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
              <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
              Additional details
            </span>
          )}
        </div>

        {/* Row 3: Category summary box */}
        <div className="mt-3 rounded-xl bg-muted/60 px-3.5 py-2.5">
          <p className="text-sm font-semibold text-foreground">
            {lead.category}
          </p>
          {summary && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {summary}
            </p>
          )}
        </div>

        {/* Row 4: Credits + First to respond */}
        <div className="flex items-center justify-between mt-3">
          {!isContacted && (
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                {lead.credits_cost} Credits
              </span>
            </div>
          )}
          {isContacted && <div />}

          {firstToRespond && !showArchived && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-4 rounded-full bg-muted-foreground/40"
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                1st to respond
              </span>
            </div>
          )}
        </div>

        {/* Archived: restore button */}
        {showArchived && (
          <button
            onClick={(e) => onRestore(e, lead.id)}
            className="mt-3 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            <Archive className="h-3.5 w-3.5" /> Restore
          </button>
        )}
      </div>
    </div>
  );
}
