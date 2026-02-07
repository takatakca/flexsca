import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Award } from "lucide-react";

interface Accreditation {
  id: string;
  name: string;
  issuer: string | null;
  year_obtained: number | null;
  sort_order: number;
}

interface Props {
  accreditations: Accreditation[];
  onAdd: (name: string, issuer?: string, year?: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function AccreditationsSection({ accreditations, onAdd, onRemove }: Props) {
  const [enabled, setEnabled] = useState(accreditations.length > 0);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [year, setYear] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    await onAdd(
      name.trim(),
      issuer.trim() || undefined,
      year ? parseInt(year) : undefined
    );
    setName("");
    setIssuer("");
    setYear("");
    setShowForm(false);
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Toggle header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Accreditations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Optional</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <>
          <p className="text-xs text-muted-foreground">
            Increase your chances of getting hired and boost customer confidence
            by adding your accreditations.
          </p>

          {/* Existing accreditations */}
          {accreditations.length > 0 && (
            <div className="space-y-2">
              {accreditations.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Award className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {a.name}
                      </p>
                      {(a.issuer || a.year_obtained) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[a.issuer, a.year_obtained].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(a.id)}
                    className="text-muted-foreground hover:text-destructive ml-2 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {showForm ? (
            <div className="space-y-3 rounded-lg border p-3">
              <div>
                <Label className="text-xs">Accreditation name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. IICRC Certified"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Issuing organization</Label>
                <Input
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="e.g. IICRC"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Year obtained</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2023"
                  className="mt-1"
                  min={1950}
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAdd}
                  disabled={!name.trim() || adding}
                  size="sm"
                  className="flex-1"
                >
                  {adding ? "Adding…" : "Add"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="default"
              className="w-full"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add accreditation
            </Button>
          )}
        </>
      )}
    </div>
  );
}
