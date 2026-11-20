import { useLongPress } from "@/hooks/useLongPress";
import { Archive, Coins, Flag, ListChecks, Phone, Zap } from "lucide-react";

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

/** "1h Ago", "17h Ago", "3d Ago": the short form used on the cards (frame 909:1102). */
export function shortAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m Ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h Ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d Ago` : `${Math.round(days / 30)}mo Ago`;
}

/** True when the customer's own answers say they are ready to hire. Nothing is inferred beyond their words. */
export function highHiringIntent(answers: Record<string, unknown> | undefined): boolean {
  return Object.values(answers ?? {}).flat().some(value => /ready to hire|definitely going to hire|hire now/i.test(String(value)));
}

const chip = "inline-flex items-center gap-1.5 rounded-fx-pill px-3 py-1 text-xs text-fx-ink";

export default function LeadCard({ lead, state, showArchived, onNavigate, onRestore, onLongPress }: LeadCardProps) {
  const isUnread = state?.is_unread ?? true;
  const isContacted = state?.contacted ?? false;
  const firstToRespond = state?.first_to_respond ?? false;
  const recent = Date.now() - new Date(lead.created_at).getTime() < 2 * 3600_000;
  const summary = buildSummary(lead);
  const longPressHandlers = useLongPress({ onLongPress, onClick: onNavigate });

  return (
    <div
      className="cursor-pointer select-none rounded-fx-sm bg-card p-5 shadow-fx-card transition-shadow hover:shadow-md"
      {...longPressHandlers}
      role="button"
      tabIndex={0}
      aria-label={`View ${lead.category} request`}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onNavigate(); } }}
    >
      {/* Row 1: unread dot, initial, name, place, time */}
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={`mt-5 size-2.5 shrink-0 rounded-full ${isUnread && !showArchived ? "bg-primary" : "bg-transparent"}`} />
        <div className="grid size-[52px] shrink-0 place-items-center rounded-full bg-[hsl(68_78%_47%)] text-xl font-bold text-fx-ink">{getInitial(lead.customer_name)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-lg text-fx-ink">{lead.customer_name || "Customer"}</h3>
            <span className={`shrink-0 whitespace-nowrap text-xs ${recent ? "rounded-fx-xs bg-[hsl(var(--fx-mint))] px-2.5 py-1 text-fx-ink" : "py-1 text-fx-muted"}`}>{shortAgo(lead.created_at)}</span>
          </div>
          {/* Town and the first half of the postal code only: the area, never the address. */}
          <p className="mt-0.5 truncate text-sm text-fx-ink">{[lead.city, lead.postal_code?.replace(/\s/g, "").slice(0, 3).toUpperCase()].filter(Boolean).join(", ") || lead.location_text}</p>
        </div>
      </div>

      {/* Row 2: chips. Each one states something the request really contains. */}
      {(lead.is_urgent || highHiringIntent(lead.answers) || lead.customer_phone || lead.has_additional_details) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {highHiringIntent(lead.answers) && <span className={`${chip} bg-accent`}><Zap className="size-3.5 fill-primary text-primary" aria-hidden="true" />High hiring intent</span>}
          {lead.is_urgent && <span className={`${chip} bg-[hsl(var(--fx-warning)/0.25)]`}><Flag className="size-3.5 fill-[hsl(var(--fx-warning))] text-[hsl(var(--fx-warning))]" aria-hidden="true" />Urgent</span>}
          {lead.customer_phone && <span className={`${chip} bg-[hsl(var(--fx-mint))]`}><Phone className="size-3.5 text-success" aria-hidden="true" />Phone provided</span>}
          {lead.has_additional_details && <span className={`${chip} bg-fx-soft`}><ListChecks className="size-3.5 text-fx-secondary" aria-hidden="true" />Additional details</span>}
        </div>
      )}

      {/* Row 3: service and the customer's answers */}
      <div className="mt-4 bg-fx-soft px-4 py-3.5">
        <p className="text-base text-fx-ink">{lead.category}</p>
        {summary && <p className="mt-1 line-clamp-2 text-sm leading-[22px] text-fx-muted">{summary}</p>}
      </div>

      {/* Row 4: cost, first to respond */}
      <div className="mt-4 flex items-center justify-between">
        {!isContacted ? <div className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-fx-ink"><Coins className="size-3 text-white" aria-hidden="true" /></span><span className="text-sm text-fx-ink">{lead.credits_cost} Credits</span></div> : <span className="text-sm text-success">Contact unlocked</span>}
        {firstToRespond && !showArchived && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5" aria-hidden="true">{[...Array(5)].map((_, i) => <span key={i} className="h-4 w-[3px] rounded-full bg-fx-line" />)}</div>
            <span className="text-sm font-bold text-fx-ink">1st to respond</span>
          </div>
        )}
      </div>

      {showArchived && <button onClick={(e) => onRestore(e, lead.id)} className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"><Archive className="h-3.5 w-3.5" aria-hidden="true" /> Restore</button>}
    </div>
  );
}
