import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { matchServices } from "@/lib/service-search";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
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
  // The services customers can request. A title chosen from this list is what links a professional to requests.
  const [catalogue, setCatalogue] = useState<{ name: string; slug: string }[]>([]);
  useEffect(() => {
    let active = true;
    void supabase.from("service_categories").select("name, slug, parent_slug").eq("is_active", true).order("name").then(({ data }) => {
      if (!active || !data) return;
      setCatalogue(data.filter(row => !data.some(other => other.parent_slug === row.slug)).map(row => ({ name: row.name, slug: row.slug })));
    });
    return () => { active = false; };
  }, []);
  const matched = catalogue.some(item => item.name.toLowerCase() === title.trim().toLowerCase());
  const suggestions = adding && title.trim().length >= 2 && !matched ? matchServices(catalogue, title).slice(0, 6) : [];

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    await onAdd(title.trim(), description.trim());
    setTitle("");
    setDescription("");
    setAdding(false);
    setSubmitting(false);
  };

  const hasServices = services.length > 0;

  // Empty state
  if (!adding && !hasServices) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-sm text-muted-foreground">Get started!</span>
          <CheckCircle2 className="h-5 w-5 text-muted-foreground/40" />
        </div>

        <div className="pt-2 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Service</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Include all services you offer in some detail to give customers the
            confidence they're looking for when making a hiring decision.
          </p>
        </div>

        <Button
          onClick={() => setAdding(true)}
          className="w-full rounded-xl text-base py-6"
        >
          <Plus className="h-5 w-5 mr-1" /> Add service
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Add the services you offer, chosen from the FLEXS list. Your request feed and your email alerts follow these services.
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
              placeholder="Start typing: plumbing, ménage, peinture…"
              className="rounded-xl"
              maxLength={100}
              autoFocus
              autoComplete="off"
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-controls="service-suggestions"
              aria-autocomplete="list"
            />
            {suggestions.length > 0 && (
              <ul id="service-suggestions" role="listbox" aria-label="Matching services" className="overflow-hidden rounded-xl border bg-card">
                {suggestions.map(item => <li key={item.slug} role="option" aria-selected="false"><button type="button" onClick={() => setTitle(item.name)} className="block w-full px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted">{item.name}</button></li>)}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              {matched ? "This is a FLEXS service: you will be shown and emailed its new requests." : "Choose a service from the list to receive its requests. A title of your own is shown on your profile only."}
            </p>
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
              className="rounded-xl flex-1 py-5 text-base"
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
          className="w-full rounded-xl py-5 text-base"
        >
          <Plus className="h-5 w-5 mr-1" /> Add service
        </Button>
      )}
    </div>
  );
}
