import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import type { CustomStatus } from "@/hooks/useCustomStatuses";
import { isAfter, subHours, subDays, subWeeks, startOfDay, subBusinessDays } from "date-fns";

export interface LeadsFilters {
  keyword: string;
  sort: "newest" | "recommended";
  unreadOnly: boolean;
  hasAdditionalDetails: boolean;
  urgentOnly: boolean;
  firstToRespondOnly: boolean;
  services: string[];
  credits: number[];
  statusIds: string[];
  timeRange: "any" | "last_hour" | "today" | "yesterday" | "3_days" | "7_days" | "2_weeks";
}

export const defaultFilters: LeadsFilters = {
  keyword: "",
  sort: "newest",
  unreadOnly: false,
  hasAdditionalDetails: false,
  urgentOnly: false,
  firstToRespondOnly: false,
  services: [],
  credits: [],
  statusIds: [],
  timeRange: "any",
};

interface LeadForCounts {
  id: string;
  category: string;
  credits_cost: number;
  has_additional_details: boolean;
  created_at: string;
  customer_phone: string | null;
}

interface FiltersSheetProps {
  open: boolean;
  onClose: () => void;
  value: LeadsFilters;
  onChange: (v: LeadsFilters) => void;
  customStatuses: CustomStatus[];
  leads: LeadForCounts[];
}

const TIME_RANGES = [
  { value: "any" as const, label: "Any time" },
  { value: "last_hour" as const, label: "Last hour" },
  { value: "today" as const, label: "Today" },
  { value: "yesterday" as const, label: "Yesterday" },
  { value: "3_days" as const, label: "Less than 3 days ago" },
  { value: "7_days" as const, label: "Less than 7 days ago" },
  { value: "2_weeks" as const, label: "Within the last 2 weeks" },
];

function getTimeRangeCutoff(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case "last_hour": return subHours(now, 1);
    case "today": return startOfDay(now);
    case "yesterday": return subDays(startOfDay(now), 1);
    case "3_days": return subDays(now, 3);
    case "7_days": return subDays(now, 7);
    case "2_weeks": return subWeeks(now, 2);
    default: return null;
  }
}

export default function FiltersSheet({
  open,
  onClose,
  value,
  onChange,
  customStatuses,
  leads,
}: FiltersSheetProps) {
  const [draft, setDraft] = useState<LeadsFilters>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  // Compute counts for each filter option
  const serviceCounts = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => {
      map.set(l.category, (map.get(l.category) || 0) + 1);
    });
    return map;
  }, [leads]);

  const creditCounts = useMemo(() => {
    const map = new Map<number, number>();
    leads.forEach((l) => {
      map.set(l.credits_cost, (map.get(l.credits_cost) || 0) + 1);
    });
    return map;
  }, [leads]);

  const timeRangeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TIME_RANGES.forEach(({ value: range }) => {
      if (range === "any") {
        counts[range] = leads.length;
      } else {
        const cutoff = getTimeRangeCutoff(range);
        if (cutoff) {
          counts[range] = leads.filter((l) => isAfter(new Date(l.created_at), cutoff)).length;
        }
      }
    });
    return counts;
  }, [leads]);

  const additionalDetailsCount = useMemo(
    () => leads.filter((l) => l.has_additional_details).length,
    [leads]
  );

  const uniqueServices = useMemo(() => {
    return Array.from(serviceCounts.keys()).sort();
  }, [serviceCounts]);

  const uniqueCredits = useMemo(() => {
    return Array.from(creditCounts.keys()).sort((a, b) => a - b);
  }, [creditCounts]);

  // Count filtered results
  const filteredCount = useMemo(() => {
    let result = leads;
    
    if (draft.services.length > 0) {
      result = result.filter((l) => draft.services.includes(l.category));
    }
    if (draft.credits.length > 0) {
      result = result.filter((l) => draft.credits.includes(l.credits_cost));
    }
    if (draft.hasAdditionalDetails) {
      result = result.filter((l) => l.has_additional_details);
    }
    if (draft.timeRange !== "any") {
      const cutoff = getTimeRangeCutoff(draft.timeRange);
      if (cutoff) {
        result = result.filter((l) => isAfter(new Date(l.created_at), cutoff));
      }
    }
    return result.length;
  }, [leads, draft]);

  function toggleArr<T extends string | number>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-none h-full max-h-full p-0 flex flex-col [&>button]:hidden"
      >
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">Filter</h2>
          <button
            onClick={() => setDraft(defaultFilters)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {/* Filtered results count */}
          <div className="pt-5 pb-4">
            <h3 className="text-xl font-bold text-foreground">
              Filtered results: {filteredCount}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {leads.length} leads matching your Lead Settings
            </p>
          </div>

          <Separator />

          {/* ── Highlights ── */}
          <div className="py-4 space-y-3">
            <CheckboxRow
              label="Has additional details"
              count={additionalDetailsCount}
              checked={draft.hasAdditionalDetails}
              onChange={(v) => setDraft((d) => ({ ...d, hasAdditionalDetails: v }))}
            />
            <CheckboxRow
              label="Unread only"
              checked={draft.unreadOnly}
              onChange={(v) => setDraft((d) => ({ ...d, unreadOnly: v }))}
            />
            <CheckboxRow
              label="1st to respond"
              checked={draft.firstToRespondOnly}
              onChange={(v) => setDraft((d) => ({ ...d, firstToRespondOnly: v }))}
            />
            <CheckboxRow
              label="Urgent"
              checked={draft.urgentOnly}
              onChange={(v) => setDraft((d) => ({ ...d, urgentOnly: v }))}
            />
          </div>

          <Separator />

          {/* ── When the lead was submitted ── */}
          <div className="py-4">
            <h4 className="text-base font-bold text-foreground mb-3">
              When the lead was submitted
            </h4>
            <div className="space-y-3">
              {TIME_RANGES.map(({ value: range, label }) => (
                <RadioRow
                  key={range}
                  label={label}
                  count={timeRangeCounts[range]}
                  selected={draft.timeRange === range}
                  onChange={() => setDraft((d) => ({ ...d, timeRange: range }))}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* ── Services ── */}
          {uniqueServices.length > 0 && (
            <>
              <div className="py-4">
                <h4 className="text-base font-bold text-foreground mb-3">Services</h4>
                <div className="space-y-3">
                  {uniqueServices.map((s) => (
                    <CheckboxRow
                      key={s}
                      label={s}
                      count={serviceCounts.get(s)}
                      checked={draft.services.includes(s)}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          services: toggleArr(d.services, s),
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* ── Credits ── */}
          {uniqueCredits.length > 0 && (
            <>
              <div className="py-4">
                <h4 className="text-base font-bold text-foreground mb-3">Credits</h4>
                <div className="space-y-3">
                  {uniqueCredits.map((c) => (
                    <CheckboxRow
                      key={c}
                      label={`${c} Credit${c !== 1 ? "s" : ""}`}
                      count={creditCounts.get(c)}
                      checked={draft.credits.includes(c)}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          credits: toggleArr(d.credits, c),
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* ── Custom Statuses ── */}
          {customStatuses.length > 0 && (
            <div className="py-4">
              <h4 className="text-base font-bold text-foreground mb-3">Status</h4>
              <div className="space-y-3">
                {customStatuses.map((s) => (
                  <CheckboxRow
                    key={s.id}
                    label={s.name}
                    checked={draft.statusIds.includes(s.id)}
                    onChange={() =>
                      setDraft((d) => ({
                        ...d,
                        statusIds: toggleArr(d.statusIds, s.id),
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Apply button (sticky bottom) ── */}
        <div className="sticky bottom-0 bg-background border-t p-4 shrink-0">
          <Button
            className="w-full rounded-xl h-12 text-base font-semibold"
            onClick={() => {
              onChange(draft);
              onClose();
            }}
          >
            Apply filter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Checkbox row with optional count ─── */
function CheckboxRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="h-5 w-5 rounded border-2 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <span className="text-base text-foreground flex-1">
        {label}
        {count !== undefined && (
          <span className="text-muted-foreground"> ({count})</span>
        )}
      </span>
    </label>
  );
}

/* ─── Radio row with optional count ─── */
function RadioRow({
  label,
  count,
  selected,
  onChange,
}: {
  label: string;
  count?: number;
  selected: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer" onClick={onChange}>
      <div
        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          selected
            ? "border-primary"
            : "border-border"
        }`}
      >
        {selected && (
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        )}
      </div>
      <span className="text-base text-foreground flex-1">
        {label}
        {count !== undefined && (
          <span className="text-muted-foreground"> ({count})</span>
        )}
      </span>
    </label>
  );
}
