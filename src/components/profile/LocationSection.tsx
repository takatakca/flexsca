import { useState } from "react";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
          Set your business city and province. Your service area below can be different.
        </p>
      </div>

      {/* Business location */}
      <div>
        <label htmlFor="business-city" className="text-sm font-medium text-foreground mb-1 block">
          Business city
        </label>
        <Input
          id="business-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter your business city"
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
        Your business city and province appear on your public profile only if the location is not marked private.
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
                When enabled, your business city and province are hidden from your public profile.
                This does not affect your private service-area matching preferences.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Province — kept for data but secondary */}
      <div>
        <label htmlFor="business-province" className="text-sm font-medium text-foreground mb-1 block">
          Province / Region
        </label>
        <Input
          id="business-province"
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
