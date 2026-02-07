import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ProviderProfile {
  user_id: string;
  company_name: string | null;
  company_description: string | null;
  company_size: string;
  years_in_business: number;
  city: string | null;
  province: string | null;
  location_private: boolean;
  profile_photo_url: string | null;
  covid_safety: string | null;
}

export interface ProviderService {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface ProviderPhoto {
  id: string;
  url: string;
  caption: string | null;
  sort_order: number;
}

export interface ProviderQA {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

const DEFAULT_PROFILE: ProviderProfile = {
  user_id: "",
  company_name: null,
  company_description: null,
  company_size: "solo",
  years_in_business: 0,
  city: null,
  province: null,
  location_private: true,
  profile_photo_url: null,
  covid_safety: null,
};

export function calculateCompletion(
  profile: ProviderProfile,
  services: ProviderService[],
  photos: ProviderPhoto[],
  qas: ProviderQA[]
): number {
  let filled = 0;
  const total = 7;

  if (profile.company_name?.trim()) filled++;
  if (profile.profile_photo_url) filled++;
  if (profile.company_description && profile.company_description.length >= 50) filled++;
  if (profile.city?.trim()) filled++;
  if (services.length >= 1) filled++;
  if (photos.length >= 1) filled++;
  if (qas.length >= 1) filled++;

  return Math.round((filled / total) * 100);
}

export function useProviderProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile>(DEFAULT_PROFILE);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [photos, setPhotos] = useState<ProviderPhoto[]>([]);
  const [qas, setQAs] = useState<ProviderQA[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, servicesRes, photosRes, qasRes] = await Promise.all([
      supabase.from("provider_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("provider_services").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("provider_photos").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("provider_qas").select("*").eq("user_id", user.id).order("sort_order"),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data as unknown as ProviderProfile);
    } else {
      setProfile({ ...DEFAULT_PROFILE, user_id: user.id });
    }

    setServices((servicesRes.data as unknown as ProviderService[]) || []);
    setPhotos((photosRes.data as unknown as ProviderPhoto[]) || []);
    setQAs((qasRes.data as unknown as ProviderQA[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const saveProfile = async (updates: Partial<ProviderProfile>) => {
    if (!user) return;
    setSaving(true);

    const newProfile = { ...profile, ...updates, user_id: user.id };

    const { error } = await supabase
      .from("provider_profiles")
      .upsert(newProfile as any, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to save profile");
      console.error(error);
    } else {
      setProfile(newProfile);
      toast.success("Profile saved");
    }
    setSaving(false);
  };

  const addService = async (title: string, description: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("provider_services")
      .insert({ user_id: user.id, title, description, sort_order: services.length } as any)
      .select()
      .single();

    if (error) {
      toast.error("Failed to add service");
    } else {
      setServices((prev) => [...prev, data as unknown as ProviderService]);
      toast.success("Service added");
    }
  };

  const removeService = async (id: string) => {
    const { error } = await supabase.from("provider_services").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove service");
    } else {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const addPhoto = async (url: string, caption?: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("provider_photos")
      .insert({ user_id: user.id, url, caption: caption || null, sort_order: photos.length } as any)
      .select()
      .single();

    if (error) {
      toast.error("Failed to add photo");
    } else {
      setPhotos((prev) => [...prev, data as unknown as ProviderPhoto]);
    }
  };

  const removePhoto = async (id: string, url: string) => {
    // Delete from storage
    const path = url.split("/provider-media/")[1];
    if (path) {
      await supabase.storage.from("provider-media").remove([path]);
    }

    const { error } = await supabase.from("provider_photos").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove photo");
    } else {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const addQA = async (question: string, answer: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("provider_qas")
      .insert({ user_id: user.id, question, answer, sort_order: qas.length } as any)
      .select()
      .single();

    if (error) {
      toast.error("Failed to add Q&A");
    } else {
      setQAs((prev) => [...prev, data as unknown as ProviderQA]);
      toast.success("Q&A added");
    }
  };

  const removeQA = async (id: string) => {
    const { error } = await supabase.from("provider_qas").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove Q&A");
    } else {
      setQAs((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("provider-media").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      return null;
    }

    const { data } = supabase.storage.from("provider-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const completion = calculateCompletion(profile, services, photos, qas);

  return {
    profile,
    services,
    photos,
    qas,
    loading,
    saving,
    completion,
    saveProfile,
    addService,
    removeService,
    addPhoto,
    removePhoto,
    addQA,
    removeQA,
    uploadPhoto,
    refetch: fetchAll,
  };
}
