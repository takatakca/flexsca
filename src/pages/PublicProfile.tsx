import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Star, MapPin, Building2, Clock, Mail, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Seo } from "@/seo/Seo";

interface ProfileData {
  company_name: string | null;
  company_description: string | null;
  company_size: string | null;
  years_in_business: number | null;
  city: string | null;
  province: string | null;
  profile_photo_url: string | null;
  personal_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  website_links: string | null;
}

interface Service {
  id: string;
  title: string;
  description: string | null;
}

interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  reviewer_name: string | null;
  created_at: string;
}

interface QA {
  id: string;
  question: string;
  answer: string;
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [qas, setQas] = useState<QA[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const [profileRes, servicesRes, photosRes, reviewsRes, qasRes] = await Promise.all([
        supabase.from("provider_profiles").select("company_name, company_description, company_size, years_in_business, city, province, profile_photo_url, personal_name, company_email, company_phone, website_links").eq("user_id", userId).maybeSingle(),
        supabase.from("provider_services").select("id, title, description").eq("user_id", userId).order("sort_order"),
        supabase.from("provider_photos").select("id, url, caption").eq("user_id", userId).order("sort_order"),
        supabase.from("provider_reviews").select("id, rating, review_text, reviewer_name, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("provider_qas").select("id, question, answer").eq("user_id", userId).order("sort_order"),
      ]);

      if (!profileRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileRes.data as ProfileData);
      setServices((servicesRes.data as Service[]) || []);
      setPhotos((photosRes.data as Photo[]) || []);
      setReviews((reviewsRes.data as Review[]) || []);
      setQas((qasRes.data as QA[]) || []);
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Seo title="Profile not found | FLEX'S" noindex />
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Profile not found</h1>
          <p className="text-sm text-muted-foreground mt-2">This professional hasn't set up their profile yet.</p>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const initial = (profile.company_name || profile.personal_name || "P").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Seo
        title={`${profile.company_name || profile.personal_name || "Professional"} | FLEX'S`}
        description={profile.company_description?.trim().slice(0, 160) || undefined}
        path={`/profile/${userId}`}
      />
      {/* Header bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">FLEX'S</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="w-full rounded-none border-b border-border bg-background h-auto p-0">
          <TabsTrigger
            value="about"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-sm font-medium"
          >
            About
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-sm font-medium"
          >
            Reviews
          </TabsTrigger>
        </TabsList>

        {/* ── About tab ── */}
        <TabsContent value="about" className="mt-0">
          <div className="px-6 py-8">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {profile.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary">{initial}</span>
              )}
            </div>

            {/* Company name */}
            <h2 className="text-2xl font-bold text-foreground mt-5">
              {profile.company_name || profile.personal_name || "Professional"}
            </h2>

            {/* Services tags */}
            {services.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {services.map((s) => (
                  <Badge key={s.id} variant="outline" className="rounded-full px-4 py-1.5 text-sm font-normal">
                    {s.title}
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="my-6" />

            {/* Description */}
            {profile.company_description && (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {profile.company_description}
                </p>
                <Separator className="my-6" />
              </>
            )}

            {/* Info grid */}
            <div className="space-y-3">
              {(profile.city || profile.province) && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{[profile.city, profile.province].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {profile.company_size && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>{profile.company_size === "solo" ? "Solo professional" : `${profile.company_size} employees`}</span>
                </div>
              )}
              {profile.years_in_business != null && profile.years_in_business > 0 && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{profile.years_in_business} year{profile.years_in_business !== 1 ? "s" : ""} in business</span>
                </div>
              )}
            </div>

            {/* Photos */}
            {photos.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="text-base font-semibold text-foreground mb-3">Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p) => (
                    <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={p.url} alt={p.caption || ""} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Q&A */}
            {qas.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="text-base font-semibold text-foreground mb-3">Q&A</h3>
                <div className="space-y-4">
                  {qas.map((qa) => (
                    <div key={qa.id}>
                      <p className="text-sm font-medium text-foreground">{qa.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">{qa.answer}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ── Reviews tab ── */}
        <TabsContent value="reviews" className="mt-0">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Reviews</h3>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-muted rounded-xl p-6">
                <p className="text-sm text-muted-foreground">
                  Be the first to leave a review for {profile.company_name || "this professional"}.
                </p>
              </div>
            ) : (
              <>
                {/* Average rating */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-5 w-5 ${s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                  </span>
                </div>

                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {r.reviewer_name && (
                        <p className="text-sm font-medium text-foreground">{r.reviewer_name}</p>
                      )}
                      {r.review_text && (
                        <p className="text-sm text-muted-foreground mt-1">{r.review_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 flex gap-3 z-20">
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl text-base font-semibold"
          onClick={() => {
            if (profile.company_email) {
              window.location.href = `mailto:${profile.company_email}`;
            }
          }}
        >
          Contact
        </Button>
        <Button
          className="flex-1 h-12 rounded-xl text-base font-semibold"
          onClick={() => {
            window.location.href = "/post-job";
          }}
        >
          Request quote
        </Button>
      </div>
    </div>
  );
}
