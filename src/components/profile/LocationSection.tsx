import { useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { ProviderProfile } from "@/hooks/useProviderProfile";

interface Props {
  profile: ProviderProfile;
  saving: boolean;
  onSave: (updates: Partial<ProviderProfile>) => Promise<void>;
}

export default function LocationSection({ profile, saving, onSave }: Props) {
  const [city, setCity] = useState(profile.city || "");
  const [province, setProvince] = useState(profile.province || "");
  const [locationPrivate, setLocationPrivate] = useState(profile.location_private);

  const handleSave = () => {
    onSave({
      city: city.trim() || null,
      province: province.trim() || null,
      location_private: locationPrivate,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <p className="text-xs">
          Enter your city only — never your home address. Turn "Make private" on to keep your location hidden from public view.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          City
        </label>
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Montréal"
          className="rounded-xl"
          maxLength={100}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Province / Region
        </label>
        <Input
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          placeholder="e.g. QC"
          className="rounded-xl"
          maxLength={50}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border px-4 py-3">
        <span className="text-sm text-foreground">Make location private</span>
        <Switch
          checked={locationPrivate}
          onCheckedChange={setLocationPrivate}
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
        {saving ? "Saving…" : "Save location"}
      </Button>
    </div>
  );
}
