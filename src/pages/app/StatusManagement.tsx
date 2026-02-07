import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Circle,
  Loader2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCustomStatuses } from "@/hooks/useCustomStatuses";
import { toast } from "sonner";

const COLOR_PALETTE = [
  "#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A", "#FEF3C7", "#FEF9C3", "#FFFBEB",
  "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE",
  "#22C55E", "#4ADE80", "#86EFAC", "#BBF7D0",
  "#EF4444", "#F87171", "#FCA5A5", "#FECACA",
  "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE",
  "#EC4899", "#F472B6", "#F9A8D4",
  "#06B6D4", "#22D3EE", "#67E8F9",
  "#F97316", "#FB923C", "#FDBA74",
  "#6B7280", "#9CA3AF", "#D1D5DB",
  "#10B981",
];

type View = "list" | "create";

export default function StatusManagement() {
  const navigate = useNavigate();
  const { statuses, loading, createStatus, deleteStatus, byCategory } = useCustomStatuses();
  const [view, setView] = useState<View>("list");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("pending");
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);
  const [saving, setSaving] = useState(false);

  const pending = byCategory("pending");
  const hired = byCategory("hired");
  const archived = byCategory("archived");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);

    const { error } = await createStatus(newName.trim(), newCategory, newColor);
    if (!error) {
      toast.success(`Status "${newName}" created`);
      setView("list");
      setNewName("");
      setNewColor(COLOR_PALETTE[0]);
    } else {
      toast.error("Failed to create status");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error("Default statuses cannot be deleted");
      return;
    }
    const { error } = await deleteStatus(id);
    if (!error) {
      toast.success(`"${name}" deleted`);
    } else {
      toast.error("Failed to delete status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Create status view ──
  if (view === "create") {
    return (
      <div className="pb-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center">
          <button onClick={() => setView("list")} className="p-1 -ml-1 text-primary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-center text-base font-semibold text-foreground">
            Create status
          </h1>
          <div className="w-6" />
        </div>

        <div className="px-4 pt-5 space-y-6">
          {/* Category */}
          <div>
            <p className="text-base font-medium text-foreground mb-2">Select category</p>
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1.5">
              Please assign a primary status for your custom status
            </p>
          </div>

          {/* Color picker */}
          <div>
            <p className="text-base font-medium text-foreground mb-3">Select colour</p>
            <div className="flex flex-wrap gap-2.5 items-center">
              {COLOR_PALETTE.slice(0, 7).map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`h-10 w-10 rounded-full transition-all ${
                    newColor === c
                      ? "ring-2 ring-offset-2 ring-foreground scale-105"
                      : "ring-0"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                onClick={() => {
                  // Show full palette in an expanded view
                  const el = document.getElementById("full-palette");
                  if (el) el.classList.toggle("hidden");
                }}
                className="h-10 w-10 rounded-full border-2 border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            {/* Expanded palette */}
            <div id="full-palette" className="hidden mt-3">
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      newColor === c
                        ? "ring-2 ring-offset-1 ring-foreground scale-110"
                        : "ring-0"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Status name */}
          <div>
            <p className="text-base font-medium text-foreground mb-2">Status name</p>
            <Input
              placeholder="e.g. Contacted twice"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-xl"
              maxLength={50}
            />
          </div>

          {/* Create button */}
          <Button
            onClick={handleCreate}
            disabled={saving || !newName.trim()}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            {saving ? "Creating…" : "Create status"}
          </Button>
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-primary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-foreground">
          Manage statuses
        </h1>
        <button onClick={() => setView("create")} className="p-1 -mr-1 text-primary">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <StatusGroup title="Pending" statuses={pending} onDelete={handleDelete} />
      <StatusGroup title="Hired" statuses={hired} onDelete={handleDelete} />
      <StatusGroup title="Archived" statuses={archived} onDelete={handleDelete} />

      {/* Add button at bottom */}
      <div className="px-4 pt-6">
        <Button
          onClick={() => setView("create")}
          className="w-full h-12 rounded-xl text-base font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" /> Create new status
        </Button>
      </div>
    </div>
  );
}

/* ── Status group ── */

function StatusGroup({
  title,
  statuses,
  onDelete,
}: {
  title: string;
  statuses: { id: string; name: string; color: string; is_default: boolean }[];
  onDelete: (id: string, name: string, isDefault: boolean) => void;
}) {
  if (statuses.length === 0) return null;

  return (
    <div>
      <div className="bg-muted px-4 py-2.5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h2>
      </div>
      <div className="divide-y divide-border">
        {statuses.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between px-4 py-3.5"
          >
            <div className="flex items-center gap-3">
              <Circle
                className="h-4 w-4 shrink-0"
                style={{ color: s.color, fill: s.color }}
              />
              <span className="text-sm font-medium text-foreground">{s.name}</span>
              {s.is_default && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  Default
                </span>
              )}
            </div>
            {!s.is_default && (
              <button
                onClick={() => onDelete(s.id, s.name, s.is_default)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
