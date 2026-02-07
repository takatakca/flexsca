import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [uploading, setUploading] = useState(false);
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
    });
  };

  const initial = companyName?.charAt(0)?.toUpperCase() || "C";
  const descLength = description.length;

  return (
    <div className="space-y-4">
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
          Company name
        </label>
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. I Clean Services"
          className="rounded-xl"
          maxLength={100}
        />
      </div>

      {/* Company size */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Company size
        </label>
        <Select value={size} onValueChange={setSize}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
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
          className="rounded-xl"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Company description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell potential customers about your business, experience, and what makes you different..."
          className="rounded-xl min-h-[120px]"
          maxLength={1000}
        />
        <p className={`text-xs mt-1 ${descLength >= 50 ? "text-muted-foreground" : "text-destructive"}`}>
          {descLength}/1000 {descLength < 50 && "(min 50 characters)"}
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
        {saving ? "Saving…" : "Save company info"}
      </Button>
    </div>
  );
}
