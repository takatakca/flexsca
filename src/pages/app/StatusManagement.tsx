import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Circle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomStatuses } from "@/hooks/useCustomStatuses";
import { toast } from "sonner";

const COLOR_OPTIONS = [
  "#3B82F6",
  "#F59E0B",
  "#8B5CF6",
  "#22C55E",
  "#10B981",
  "#EF4444",
  "#6B7280",
  "#EC4899",
  "#F97316",
  "#06B6D4",
];

export default function StatusManagement() {
  const navigate = useNavigate();
  const { statuses, loading, createStatus, deleteStatus, byCategory } = useCustomStatuses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("pending");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
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
      setDialogOpen(false);
      setNewName("");
      setNewColor(COLOR_OPTIONS[0]);
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

  return (
    <div className="p-4 space-y-4 pb-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-primary mb-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Manage statuses</h1>
        <Button
          size="sm"
          className="rounded-xl"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <StatusGroup title="Pending" statuses={pending} onDelete={handleDelete} />
      <StatusGroup title="Hired" statuses={hired} onDelete={handleDelete} />
      <StatusGroup title="Archived" statuses={archived} onDelete={handleDelete} />

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Status name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-xl"
            />

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

            <div>
              <p className="text-sm text-muted-foreground mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      newColor === c ? "scale-110 border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
              className="w-full rounded-xl"
            >
              {saving ? "Creating…" : "Create status"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {statuses.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-2">
              <Circle
                className="h-3 w-3 shrink-0"
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
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
