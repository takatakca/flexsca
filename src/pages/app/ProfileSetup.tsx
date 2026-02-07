import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import ProfileCompletionMeter from "@/components/profile/ProfileCompletionMeter";
import CompanySection from "@/components/profile/CompanySection";
import LocationSection from "@/components/profile/LocationSection";
import ServicesSection from "@/components/profile/ServicesSection";
import PhotosSection from "@/components/profile/PhotosSection";
import QASection from "@/components/profile/QASection";
import AccreditationsSection from "@/components/profile/AccreditationsSection";
import SocialMediaSection from "@/components/profile/SocialMediaSection";
import ReviewsSection from "@/components/profile/ReviewsSection";
import { useProviderProfile } from "@/hooks/useProviderProfile";

type SectionKey = "about" | "reviews" | "services" | "photos" | "social" | "accreditations" | "qa" | "location" | null;

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionKey>(null);
  const {
    profile,
    services,
    photos,
    qas,
    accreditations,
    loading,
    saving,
    completion,
    saveProfile,
    addService,
    removeService,
    addPhoto,
    removePhoto,
    saveAllQAs,
    addAccreditation,
    removeAccreditation,
    uploadPhoto,
  } = useProviderProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Section completion checks
  const sectionComplete: Record<string, boolean> = {
    about: !!(
      profile.company_name?.trim() &&
      profile.profile_photo_url &&
      profile.company_description &&
      profile.company_description.length >= 50
    ),
    reviews: false, // optional
    services: services.length >= 1,
    photos: photos.length >= 1,
    social: !!(profile.facebook_url || profile.twitter_handle || profile.instagram_handle),
    accreditations: accreditations.length >= 1,
    qa: qas.length >= 1,
    location: !!profile.city?.trim(),
  };

  // If a section is open, render it as a detail page
  if (activeSection) {
    return (
      <SectionDetail
        title={SECTION_LABELS[activeSection]}
        onBack={() => setActiveSection(null)}
      >
        {activeSection === "about" && (
          <CompanySection
            profile={profile}
            saving={saving}
            onSave={saveProfile}
            onUploadPhoto={uploadPhoto}
          />
        )}
        {activeSection === "location" && (
          <LocationSection profile={profile} saving={saving} onSave={saveProfile} />
        )}
        {activeSection === "services" && (
          <ServicesSection services={services} onAdd={addService} onRemove={removeService} />
        )}
        {activeSection === "photos" && (
          <PhotosSection
            photos={photos}
            profile={profile}
            saving={saving}
            onUpload={uploadPhoto}
            onAddPhoto={addPhoto}
            onRemove={removePhoto}
            onSaveProfile={saveProfile}
          />
        )}
        {activeSection === "qa" && <QASection qas={qas} onSaveAll={saveAllQAs} />}
        {activeSection === "accreditations" && (
          <AccreditationsSection
            accreditations={accreditations}
            onAdd={addAccreditation}
            onRemove={removeAccreditation}
          />
        )}
        {activeSection === "social" && (
          <SocialMediaSection profile={profile} saving={saving} onSave={saveProfile} />
        )}
        {activeSection === "reviews" && <ReviewsSection />}
      </SectionDetail>
    );
  }

  // Main profile list view
  const SECTIONS: { key: SectionKey; optional?: boolean }[] = [
    { key: "about" },
    { key: "reviews", optional: true },
    { key: "services" },
    { key: "photos" },
    { key: "social", optional: true },
    { key: "accreditations", optional: true },
    { key: "qa" },
    { key: "location" },
  ];

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-foreground">
          Your profile
        </h1>
        <div className="w-6" /> {/* Spacer for centering */}
      </div>

      {/* Completion meter */}
      <div className="px-4 pt-5 pb-4">
        <ProfileCompletionMeter completion={completion} />

        <button className="text-sm text-primary font-medium mt-3 hover:underline">
          View public profile
        </button>
      </div>

      {/* Sections list */}
      <div className="border-t border-border">
        {SECTIONS.map(({ key }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className="flex items-center w-full px-4 py-4 border-b border-border hover:bg-muted/30 transition-colors text-left"
          >
            <span className="flex-1 text-base font-medium text-foreground">
              {SECTION_LABELS[key!]}
            </span>
            <SectionCheckmark completed={sectionComplete[key!]} />
            <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Section labels ── */

const SECTION_LABELS: Record<string, string> = {
  about: "About",
  reviews: "Reviews",
  services: "Services",
  photos: "Photos",
  social: "Social media & links",
  accreditations: "Accreditations",
  qa: "Q&A",
  location: "Location",
};

/* ── Checkmark indicator ── */

function SectionCheckmark({ completed }: { completed: boolean }) {
  return (
    <CheckCircle2
      className={`h-6 w-6 ${
        completed
          ? "text-primary fill-primary/10"
          : "text-muted-foreground/30"
      }`}
    />
  );
}

/* ── Section detail wrapper ── */

function SectionDetail({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center">
        <button onClick={onBack} className="p-1 -ml-1 text-primary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-foreground">
          {title}
        </h1>
        <div className="w-6" />
      </div>

      {/* Content */}
      <div className="px-4 pt-5">{children}</div>
    </div>
  );
}
