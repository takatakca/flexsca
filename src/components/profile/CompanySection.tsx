import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ProviderProfile } from "@/hooks/useProviderProfile";

interface Props {
  profile: ProviderProfile;
  saving: boolean;
  onSave: (updates: Partial<ProviderProfile>) => Promise<void>;
  onUploadPhoto: (file: File) => Promise<string | null>;
}

const COMPANY_SIZES = [
  { value: "solo", label: "Just me (sole trader)" },
  { value: "2-5", label: "2–5 people" },
  { value: "6-10", label: "6–10 people" },
  { value: "11-50", label: "11–50 people" },
  { value: "50+", label: "50+ people" },
];

export default function CompanySection({ profile, saving, onSave, onUploadPhoto }: Props) {
  const [companyName, setCompanyName] = useState(profile.company_name || "");
  const [description, setDescription] = useState(profile.company_description || "");
  const [size, setSize] = useState(profile.company_size || "solo");
  const [years, setYears] = useState(profile.years_in_business?.toString() || "0");
  const [website, setWebsite] = useState(profile.website_links || "");
  const [companyEmail, setCompanyEmail] = useState(profile.company_email || "");
  const [companyPhone, setCompanyPhone] = useState(profile.company_phone || "");
  const [uploading, setUploading] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setUploading(true);
    const url = await onUploadPhoto(file);
    if (url) {
      await onSave({ profile_photo_url: url });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = () => {
    onSave({
      company_name: companyName.trim() || null,
      company_description: description.trim() || null,
      company_size: size,
      years_in_business: parseInt(years) || 0,
      website_links: website.trim() || null,
      company_email: companyEmail.trim() || null,
      company_phone: companyPhone.trim() || null,
    });
  };

  const initial = companyName?.charAt(0)?.toUpperCase() || "C";
  const descLength = description.length;

  return (
    <div className="space-y-5">
      {/* Profile photo */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-border">
            {profile.profile_photo_url ? (
              <AvatarImage src={profile.profile_photo_url} alt="Profile" />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
        <p className="text-xs text-muted-foreground">
          Tap to add a profile photo
        </p>
      </div>

      {/* Company name */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Name
        </label>
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. I Clean Services"
          className="rounded-xl"
          maxLength={100}
        />
      </div>

      {/* Company contact details heading */}
      <div className="space-y-1.5 pt-2">
        <h3 className="text-lg font-semibold text-foreground">
          Company contact details
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This information will be seen by customers on FLEX'S. Change the details FLEX'S uses to contact you privately in{" "}
          <span className="text-primary font-medium">Account details</span>
        </p>
      </div>

      {/* Company email */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Company email address
        </label>
        <Input
          type="email"
          value={companyEmail}
          onChange={(e) => setCompanyEmail(e.target.value)}
          placeholder="your@company.com"
          className="rounded-xl"
          maxLength={200}
        />
      </div>

      {/* Company phone */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Company phone number
        </label>
        <Input
          type="tel"
          value={companyPhone}
          onChange={(e) => setCompanyPhone(e.target.value)}
          placeholder="Company phone number"
          className="rounded-xl"
          maxLength={30}
        />
      </div>

      {/* Website */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Website
        </label>
        <Input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Website"
          className="rounded-xl"
          maxLength={300}
        />
      </div>

      {/* About the company heading */}
      <h3 className="text-lg font-semibold text-foreground pt-2">
        About the company
      </h3>

      {/* Company size */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Company size
        </label>
        <Select value={size} onValueChange={setSize}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select one" />
          </SelectTrigger>
          <SelectContent>
            {COMPANY_SIZES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Years in business */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Years in business
        </label>
        <Input
          type="number"
          min={0}
          max={100}
          value={years}
          onChange={(e) => setYears(e.target.value)}
          placeholder="Number of years"
          className="rounded-xl"
        />
      </div>

      {/* Company Description */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Company Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What sets you apart from other businesses?"
          className="rounded-xl min-h-[120px]"
          maxLength={1000}
        />
        <p className={`text-xs mt-1 ${descLength >= 50 ? "text-muted-foreground" : "text-destructive"}`}>
          {descLength}/1000 {descLength < 50 && "(min 50 characters)"}
        </p>
      </div>

      {/* Tips collapsible */}
      <Collapsible open={showTips} onOpenChange={setShowTips}>
        <CollapsibleTrigger asChild>
          <button className="text-sm text-primary font-medium hover:underline">
            Here's our tips for writing a great description
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Tips for a great profile description:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Introduce yourself and your business</li>
              <li>Mention your experience and qualifications</li>
              <li>Highlight what makes you different from competitors</li>
              <li>Keep it friendly and professional</li>
              <li>Aim for at least 50 characters — more detail helps customers trust you</li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
        {saving ? "Saving…" : "Save company info"}
      </Button>
    </div>
  );
}
