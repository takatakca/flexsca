import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ProviderService } from "@/hooks/useProviderProfile";

interface Props {
  services: ProviderService[];
  onAdd: (title: string, description: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function ServicesSection({ services, onAdd, onRemove }: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    await onAdd(title.trim(), description.trim());
    setTitle("");
    setDescription("");
    setAdding(false);
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Add the services you offer. FLEX'S matches leads based on your services — put your most important one first.
      </p>

      {services.map((service) => (
        <div
          key={service.id}
          className="rounded-xl border p-3 flex items-start justify-between gap-2"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {service.title}
            </p>
            {service.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {service.description}
              </p>
            )}
          </div>
          <button
            onClick={() => onRemove(service.id)}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="space-y-5">
          <p className="text-base font-medium text-foreground">
            Describe what you can offer to customers
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="service-title" className="text-sm text-muted-foreground">
              Project title
            </Label>
            <Input
              id="service-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Service Type"
              className="rounded-xl"
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service-desc" className="text-sm text-muted-foreground">
              Service description
            </Label>
            <Textarea
              id="service-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=""
              className="rounded-xl min-h-[100px]"
              maxLength={500}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAdd}
              disabled={submitting || !title.trim()}
              className="rounded-xl flex-1"
            >
              {submitting ? "Adding…" : "Add"}
            </Button>
            <Button
              onClick={() => {
                setAdding(false);
                setTitle("");
                setDescription("");
              }}
              variant="outline"
              className="rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setAdding(true)}
          variant="outline"
          className="w-full rounded-xl"
        >
          <Plus className="h-4 w-4 mr-1" /> Add service
        </Button>
      )}
    </div>
  );
}
