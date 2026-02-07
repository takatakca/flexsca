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
  const [personalName, setPersonalName] = useState(profile.personal_name || "");
  const [description, setDescription] = useState(profile.company_description || "");
  const [size, setSize] = useState(profile.company_size || "solo");
  const [years, setYears] = useState(profile.years_in_business?.toString() || "0");
  const [website, setWebsite] = useState(profile.website_links || "");
  const [companyEmail, setCompanyEmail] = useState(profile.company_email || "");
  const [companyPhone, setCompanyPhone] = useState(profile.company_phone || "");
  const [uploadingCompany, setUploadingCompany] = useState(false);
  const [uploadingPersonal, setUploadingPersonal] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const companyFileRef = useRef<HTMLInputElement>(null);
  const personalFileRef = useRef<HTMLInputElement>(null);

  const handleCompanyPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    setUploadingCompany(true);
    const url = await onUploadPhoto(file);
    if (url) await onSave({ profile_photo_url: url });
    setUploadingCompany(false);
    if (companyFileRef.current) companyFileRef.current.value = "";
  };

  const handlePersonalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    setUploadingPersonal(true);
    const url = await onUploadPhoto(file);
    if (url) await onSave({ personal_photo_url: url });
    setUploadingPersonal(false);
    if (personalFileRef.current) personalFileRef.current.value = "";
  };

  const handleSave = () => {
    onSave({
      company_name: companyName.trim() || null,
      personal_name: personalName.trim() || null,
      company_description: description.trim() || null,
      company_size: size,
      years_in_business: parseInt(years) || 0,
      website_links: website.trim() || null,
      company_email: companyEmail.trim() || null,
      company_phone: companyPhone.trim() || null,
    });
  };

  const companyInitial = companyName?.charAt(0)?.toUpperCase() || "C";
  const personalInitial = personalName?.charAt(0)?.toUpperCase() || "P";
  const descLength = description.length;

  return (
    <div className="space-y-6">
      {/* ── Section 1: Company name & logo ── */}
      <div className="space-y-1.5">
        <h3 className="text-xl font-semibold text-foreground">Company name & logo</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This is the first thing customers will see when searching for a professional. As a sole-trader, you can just enter your name.
        </p>
      </div>

      <PhotoUpload
        photoUrl={profile.profile_photo_url}
        initial={companyInitial}
        uploading={uploadingCompany}
        fileRef={companyFileRef}
        onFileChange={handleCompanyPhotoUpload}
      />

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Company name</label>
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Cleaning inc"
          className="rounded-xl"
          maxLength={100}
        />
      </div>

      {/* ── Section 2: Name & profile picture ── */}
      <div className="space-y-1.5 pt-4 border-t border-border">
        <h3 className="text-xl font-semibold text-foreground">Name & profile picture</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This is the person who will be communicating with customers on FLEX'S. The photo will appear alongside your messages with customers.
        </p>
      </div>

      <PhotoUpload
        photoUrl={profile.personal_photo_url}
        initial={personalInitial}
        uploading={uploadingPersonal}
        fileRef={personalFileRef}
        onFileChange={handlePersonalPhotoUpload}
      />

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
        <Input
          value={personalName}
          onChange={(e) => setPersonalName(e.target.value)}
          placeholder="Your name"
          className="rounded-xl"
          maxLength={100}
        />
      </div>

      {/* ── Section 3: Company contact details ── */}
      <div className="space-y-1.5 pt-4 border-t border-border">
        <h3 className="text-xl font-semibold text-foreground">Company contact details</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This information will be seen by customers on FLEX'S. Change the details FLEX'S uses to contact you privately in{" "}
          <span className="text-primary font-medium">Account details</span>
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Company email address</label>
        <Input
          type="email"
          value={companyEmail}
          onChange={(e) => setCompanyEmail(e.target.value)}
          placeholder="your@company.com"
          className="rounded-xl"
          maxLength={200}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Company phone number</label>
        <Input
          type="tel"
          value={companyPhone}
          onChange={(e) => setCompanyPhone(e.target.value)}
          placeholder="Company phone number"
          className="rounded-xl"
          maxLength={30}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Website</label>
        <Input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Website"
          className="rounded-xl"
          maxLength={300}
        />
      </div>

      {/* ── Section 4: About the company ── */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-xl font-semibold text-foreground">About the company</h3>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Company size</label>
        <Select value={size} onValueChange={setSize}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select one" />
          </SelectTrigger>
          <SelectContent>
            {COMPANY_SIZES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Years in business</label>
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

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Company Description</label>
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

/* ── Reusable photo upload sub-component ── */

interface PhotoUploadProps {
  photoUrl: string | null;
  initial: string;
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function PhotoUpload({ photoUrl, initial, uploading, fileRef, onFileChange }: PhotoUploadProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="h-24 w-24 border-2 border-border">
          {photoUrl ? <AvatarImage src={photoUrl} alt="Photo" /> : null}
          <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <p className="text-xs text-muted-foreground">Tap to add a photo</p>
    </div>
  );
}
