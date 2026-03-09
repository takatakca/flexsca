import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
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
  "#10B981", "#1E3A5F",
];

type View = "list" | "create";

export default function StatusManagement() {
  const navigate = useNavigate();
  const { statuses, loading, createStatus, deleteStatus, byCategory } =
    useCustomStatuses();
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

  const handleDelete = async (
    id: string,
    name: string,
    isDefault: boolean
  ) => {
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

  /* ── Create status view ── */
  if (view === "create") {
    return (
      <div className="pb-8 min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center">
          <button
            onClick={() => setView("list")}
            className="p-1 -ml-1 text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-foreground">
            Create status
          </h1>
          <div className="w-6" />
        </div>

        <div className="px-4 pt-5 space-y-6">
          {/* Category */}
          <div>
            <p className="text-base font-semibold text-foreground mb-2">
              Select category
            </p>
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="rounded-xl h-12">
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
            <p className="text-base font-semibold text-foreground mb-3">
              Select colour
            </p>
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
                  const el = document.getElementById("full-palette");
                  if (el) el.classList.toggle("hidden");
                }}
                className="h-10 w-10 rounded-full border-2 border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

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
            <p className="text-base font-semibold text-foreground mb-2">
              Status name
            </p>
            <Input
              placeholder="e.g. Contacted twice"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-xl h-12"
              maxLength={50}
            />
          </div>

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

  /* ── List view (colored pills) ── */
  return (
    <div className="pb-8 min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground">
          Manage statuses
        </h1>
        <div className="w-6" />
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Create new button */}
        <button
          onClick={() => setView("create")}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-4 text-primary font-semibold text-base hover:bg-primary/10 transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          Create new
        </button>

        <StatusPillGroup
          title="Pending statuses"
          statuses={pending}
          onDelete={handleDelete}
        />
        <StatusPillGroup
          title="Hired statuses"
          statuses={hired}
          onDelete={handleDelete}
        />
        <StatusPillGroup
          title="Archived statuses"
          statuses={archived}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

/* ── Status pill group ── */

function StatusPillGroup({
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
      <h2 className="text-base font-bold text-foreground mb-3">{title}</h2>
      <div className="space-y-3">
        {statuses.map((s) => (
          <div
            key={s.id}
            className="relative rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="flex items-center justify-between pr-3">
              <div
                className="flex-1 rounded-xl m-2 px-5 py-3.5 text-white font-semibold text-sm"
                style={{ backgroundColor: s.color }}
              >
                {s.name}
              </div>
              {!s.is_default && (
                <button
                  onClick={() => onDelete(s.id, s.name, s.is_default)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
