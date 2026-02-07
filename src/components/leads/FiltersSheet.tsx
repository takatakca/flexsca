import { useState, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CustomStatus } from "@/hooks/useCustomStatuses";

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
};

const SERVICE_OPTIONS = [
  "House Cleaning",
  "Deep Cleaning Services",
  "End of Tenancy Cleaning",
  "Plumbing",
  "Electrical Work",
  "Painting & Decorating",
  "Garden Maintenance",
  "Removals",
  "Dog Walking",
];

const CREDIT_OPTIONS = [1, 3, 5, 6, 7, 8, 9, 10];

interface FiltersSheetProps {
  open: boolean;
  onClose: () => void;
  value: LeadsFilters;
  onChange: (v: LeadsFilters) => void;
  customStatuses: CustomStatus[];
}

export default function FiltersSheet({
  open,
  onClose,
  value,
  onChange,
  customStatuses,
}: FiltersSheetProps) {
  const [draft, setDraft] = useState<LeadsFilters>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  function toggleArr<T extends string | number>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  const activeCount = [
    draft.unreadOnly,
    draft.hasAdditionalDetails,
    draft.urgentOnly,
    draft.firstToRespondOnly,
    draft.services.length > 0,
    draft.credits.length > 0,
    draft.statusIds.length > 0,
    draft.keyword.trim().length > 0,
  ].filter(Boolean).length;

  const pending = customStatuses.filter((s) => s.category === "pending");
  const hired = customStatuses.filter((s) => s.category === "hired");
  const archived = customStatuses.filter((s) => s.category === "archived");

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 z-10 bg-background border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Filters</SheetTitle>
            <button
              onClick={() => setDraft(defaultFilters)}
              className="flex items-center gap-1 text-xs text-primary font-medium"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
        </SheetHeader>

        <div className="p-4 space-y-5">
          {/* Keyword search */}
          <div>
            <label className="text-sm font-semibold text-foreground">Keyword search</label>
            <Input
              className="mt-2 rounded-xl"
              placeholder="e.g. cleaning, plumbing…"
              value={draft.keyword}
              onChange={(e) => setDraft((d) => ({ ...d, keyword: e.target.value }))}
            />
          </div>

          <Separator />

          {/* Toggle filters */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">View</label>
            <FilterToggle
              label="Unread only"
              checked={draft.unreadOnly}
              onChange={(v) => setDraft((d) => ({ ...d, unreadOnly: v }))}
            />
            <FilterToggle
              label="Has additional details"
              checked={draft.hasAdditionalDetails}
              onChange={(v) => setDraft((d) => ({ ...d, hasAdditionalDetails: v }))}
            />
            <FilterToggle
              label="Urgent"
              checked={draft.urgentOnly}
              onChange={(v) => setDraft((d) => ({ ...d, urgentOnly: v }))}
            />
            <FilterToggle
              label="1st to respond"
              checked={draft.firstToRespondOnly}
              onChange={(v) => setDraft((d) => ({ ...d, firstToRespondOnly: v }))}
            />
          </div>

          <Separator />

          {/* Services */}
          <div>
            <label className="text-sm font-semibold text-foreground">Services</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map((s) => (
                <ChipToggle
                  key={s}
                  label={s}
                  active={draft.services.includes(s)}
                  onClick={() =>
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

          {/* Credits */}
          <div>
            <label className="text-sm font-semibold text-foreground">Credits</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CREDIT_OPTIONS.map((c) => (
                <ChipToggle
                  key={c}
                  label={`${c}`}
                  active={draft.credits.includes(c)}
                  onClick={() =>
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

          {/* Status */}
          {customStatuses.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-foreground">Status</label>
              {pending.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Pending</p>
                  <div className="flex flex-wrap gap-2">
                    {pending.map((s) => (
                      <ChipToggle
                        key={s.id}
                        label={s.name}
                        active={draft.statusIds.includes(s.id)}
                        color={s.color}
                        onClick={() =>
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
              {hired.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Hired</p>
                  <div className="flex flex-wrap gap-2">
                    {hired.map((s) => (
                      <ChipToggle
                        key={s.id}
                        label={s.name}
                        active={draft.statusIds.includes(s.id)}
                        color={s.color}
                        onClick={() =>
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
              {archived.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Archived</p>
                  <div className="flex flex-wrap gap-2">
                    {archived.map((s) => (
                      <ChipToggle
                        key={s.id}
                        label={s.name}
                        active={draft.statusIds.includes(s.id)}
                        color={s.color}
                        onClick={() =>
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
          )}
        </div>

        {/* Apply button */}
        <div className="sticky bottom-0 bg-background border-t p-4 space-y-2">
          <Button
            className="w-full rounded-xl h-12 text-base font-semibold"
            onClick={() => {
              onChange(draft);
              onClose();
            }}
          >
            Apply filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ChipToggle({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:bg-accent"
      }`}
      style={
        active && color
          ? { backgroundColor: color, borderColor: color, color: "#fff" }
          : undefined
      }
    >
      {label}
    </button>
  );
}
