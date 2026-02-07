import { useState } from "react";
import { MapPin, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProviderProfile } from "@/hooks/useProviderProfile";

interface Props {
  profile: ProviderProfile;
  saving: boolean;
  onSave: (updates: Partial<ProviderProfile>) => Promise<void>;
}

const LOCATION_REASONS = [
  { value: "home_based", label: "I work from home" },
  { value: "travel_to_clients", label: "I travel to my clients" },
  { value: "security", label: "Security reasons" },
  { value: "other", label: "Other" },
];

export default function LocationSection({ profile, saving, onSave }: Props) {
  const [city, setCity] = useState(profile.city || "");
  const [province, setProvince] = useState(profile.province || "");
  const [locationPrivate, setLocationPrivate] = useState(profile.location_private);
  const [privateReason, setPrivateReason] = useState("");

  const handleSave = () => {
    onSave({
      city: city.trim() || null,
      province: province.trim() || null,
      location_private: locationPrivate,
    });
  };

  return (
    <div className="space-y-4">
      {/* Service area info callout */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-1.5">
        <p className="text-sm font-semibold text-foreground">
          Will this affect my service area?
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          No, this location will not affect where you provide a service. Service
          areas can be edited or updated in your{" "}
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={() => {}}
          >
            lead settings
          </button>
          .
        </p>
      </div>

      {/* Display notice */}
      <p className="text-sm font-medium text-foreground leading-relaxed">
        Customers will see the location you've selected displayed on your profile
      </p>

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

      {/* Make private checkbox — Bark-style */}
      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id="make-private"
          checked={locationPrivate}
          onCheckedChange={(checked) => setLocationPrivate(!!checked)}
          className="rounded"
        />
        <label
          htmlFor="make-private"
          className="text-sm font-medium text-foreground cursor-pointer"
        >
          Make private
        </label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-[200px]">
                When enabled, your exact location won't be shown on your public profile.
                Only your city will be visible.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Reason dropdown — only shown when private is checked */}
      {locationPrivate && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground block">
            Can't give us a particular location?
          </label>
          <Select value={privateReason} onValueChange={setPrivateReason}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
        {saving ? "Saving…" : "Save location"}
      </Button>
    </div>
  );
}
