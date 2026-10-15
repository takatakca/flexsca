import { useState } from "react";
import { Info } from "lucide-react";
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
  const [serviceCity, setServiceCity] = useState(profile.service_area_city || "");
  const [serviceProvince, setServiceProvince] = useState(profile.service_area_province || "");
  const [localOnly, setLocalOnly] = useState(profile.match_service_area_only);
  const [serviceError, setServiceError] = useState("");

  const handleSave = () => {
    if (localOnly && !serviceCity.trim()) {
      setServiceError("Enter a service-area city to enable local matching.");
      return;
    }
    setServiceError("");
    void onSave({
      city: city.trim() || null,
      province: province.trim() || null,
      location_private: locationPrivate,
      service_area_city: serviceCity.trim() || null,
      service_area_province: serviceProvince.trim() || null,
      match_service_area_only: localOnly,
    });
  };

  return (
    <div className="space-y-5">
      {/* Company location heading */}
      <div className="space-y-1.5">
        <h3 className="text-xl font-semibold text-foreground">Company location</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Use a specific address to help customers searching for a local business.
        </p>
      </div>

      {/* Business location */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          What's the business location?
        </label>
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter the company's address"
          className="rounded-xl"
          maxLength={200}
        />
      </div>

      <section className="rounded-xl border p-4 space-y-4" aria-labelledby="service-area-heading">
        <div>
          <h3 id="service-area-heading" className="font-semibold text-foreground">Where you offer services</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the city where you work, separately from your public business location.
            This first version matches city names, not driving distance.
          </p>
        </div>
        <div>
          <label htmlFor="service-area-city" className="block text-sm font-medium mb-1">Service area city</label>
          <Input id="service-area-city" maxLength={120} value={serviceCity} placeholder="e.g. Montréal"
            onChange={e => { setServiceCity(e.target.value); setServiceError(""); }}
            aria-invalid={!!serviceError} aria-describedby={serviceError ? "service-area-error" : undefined} />
        </div>
        <div>
          <label htmlFor="service-area-province" className="block text-sm font-medium mb-1">Service area province (optional)</label>
          <Input id="service-area-province" maxLength={40} value={serviceProvince} placeholder="e.g. QC"
            onChange={e => setServiceProvince(e.target.value)} />
        </div>
        <div className="flex gap-2 items-start">
          <Checkbox id="match-local-only" checked={localOnly}
            onCheckedChange={checked => setLocalOnly(checked === true)} />
          <label htmlFor="match-local-only" className="text-sm leading-snug cursor-pointer">
            Only show new marketplace requests from my service area.
            <span className="block text-muted-foreground">Requests you have already unlocked remain accessible.</span>
          </label>
        </div>
        {serviceError && <p id="service-area-error" role="alert" className="text-sm text-destructive">{serviceError}</p>}
      </section>

      {/* Display notice */}
      <p className="text-sm font-medium text-foreground leading-relaxed">
        Customers will see the location you've selected displayed on your profile
      </p>

      {/* Make private checkbox */}
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

      {/* Province — kept for data but secondary */}
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

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
        {saving ? "Saving…" : "Save location"}
      </Button>
    </div>
  );
}
