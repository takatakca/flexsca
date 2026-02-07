import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Briefcase, Camera, HelpCircle, Award, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ProfileCompletionMeter from "@/components/profile/ProfileCompletionMeter";
import CompanySection from "@/components/profile/CompanySection";
import LocationSection from "@/components/profile/LocationSection";
import ServicesSection from "@/components/profile/ServicesSection";
import PhotosSection from "@/components/profile/PhotosSection";
import QASection from "@/components/profile/QASection";
import AccreditationsSection from "@/components/profile/AccreditationsSection";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { Badge } from "@/components/ui/badge";

export default function ProfileSetup() {
  const navigate = useNavigate();
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

  const sectionStatus = (filled: boolean) =>
    filled ? (
      <Badge variant="secondary" className="text-[10px] bg-accent text-accent-foreground">
        ✓ Done
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-[10px]">
        Incomplete
      </Badge>
    );

  return (
    <div className="p-4 space-y-4 pb-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-primary mb-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-xl font-bold text-foreground">
          Set up your profile
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete your profile to start receiving leads on FLEX'S
        </p>
      </div>

      {/* Completion meter */}
      <Card>
        <CardContent className="pt-5">
          <ProfileCompletionMeter completion={completion} />
        </CardContent>
      </Card>

      {/* Accordion sections */}
      <Accordion type="single" collapsible defaultValue="company" className="space-y-3">
        {/* Company identity */}
        <AccordionItem value="company" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Company</span>
              <div className="ml-auto mr-2">
                {sectionStatus(
                  !!(profile.company_name?.trim() && profile.profile_photo_url && profile.company_description && profile.company_description.length >= 50)
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <CompanySection
              profile={profile}
              saving={saving}
              onSave={saveProfile}
              onUploadPhoto={uploadPhoto}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Location */}
        <AccordionItem value="location" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Location</span>
              <div className="ml-auto mr-2">
                {sectionStatus(!!profile.city?.trim())}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <LocationSection
              profile={profile}
              saving={saving}
              onSave={saveProfile}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Services */}
        <AccordionItem value="services" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Services</span>
              <div className="ml-auto mr-2">
                {sectionStatus(services.length >= 1)}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ServicesSection
              services={services}
              onAdd={addService}
              onRemove={removeService}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Photos */}
        <AccordionItem value="photos" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Camera className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Photos</span>
              <div className="ml-auto mr-2">
                {sectionStatus(photos.length >= 1)}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <PhotosSection
              photos={photos}
              onUpload={uploadPhoto}
              onAddPhoto={addPhoto}
              onRemove={removePhoto}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Q&A */}
        <AccordionItem value="qa" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Q&A</span>
              <div className="ml-auto mr-2">
                {sectionStatus(qas.length >= 1)}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <QASection
              qas={qas}
              onSaveAll={saveAllQAs}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Accreditations */}
        <AccordionItem value="accreditations" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Accreditations</span>
              <div className="ml-auto mr-2">
                <Badge variant="secondary" className="text-[10px]">
                  Optional
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <AccreditationsSection
              accreditations={accreditations}
              onAdd={addAccreditation}
              onRemove={removeAccreditation}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
