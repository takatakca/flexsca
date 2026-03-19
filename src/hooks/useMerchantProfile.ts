import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface MerchantProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  business_description: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  rating: number;
  review_count: number;
  primary_category: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  phone: string | null;
  website: string | null;
  menu_url: string | null;
  latitude: number | null;
  longitude: number | null;
  specialties: string | null;
  history: string | null;
  business_status: string;
  verified: boolean;
  verified_at: string | null;
}

export interface MerchantCategory {
  id: string;
  merchant_id: string;
  category_name: string;
  sort_order: number;
}

export interface MerchantAmenity {
  id: string;
  merchant_id: string;
  name: string;
  icon: string | null;
  enabled: boolean;
  sort_order: number;
}

export interface MerchantHours {
  id: string;
  merchant_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface MerchantMedia {
  id: string;
  merchant_id: string;
  url: string;
  media_type: string;
  caption: string | null;
  sort_order: number;
}

export interface MerchantCTA {
  id: string;
  merchant_id: string;
  title: string;
  description: string | null;
  button_text: string;
  button_url: string | null;
  is_active: boolean;
}

export interface MerchantHighlight {
  id: string;
  merchant_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export function useMerchantProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [categories, setCategories] = useState<MerchantCategory[]>([]);
  const [amenities, setAmenities] = useState<MerchantAmenity[]>([]);
  const [hours, setHours] = useState<MerchantHours[]>([]);
  const [media, setMedia] = useState<MerchantMedia[]>([]);
  const [ctas, setCTAs] = useState<MerchantCTA[]>([]);
  const [highlights, setHighlights] = useState<MerchantHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get or create merchant profile
    let { data: prof } = await supabase
      .from("merchant_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!prof) {
      const { data: newProf } = await supabase
        .from("merchant_profiles")
        .insert({ user_id: user.id } as any)
        .select()
        .single();
      prof = newProf;
    }

    if (prof) {
      setProfile(prof as unknown as MerchantProfile);
      const mid = (prof as any).id;

      const [catRes, amenRes, hoursRes, mediaRes, ctaRes, hlRes] = await Promise.all([
        supabase.from("merchant_categories").select("*").eq("merchant_id", mid).order("sort_order"),
        supabase.from("merchant_amenities").select("*").eq("merchant_id", mid).order("sort_order"),
        supabase.from("merchant_hours").select("*").eq("merchant_id", mid).order("day_of_week"),
        supabase.from("merchant_media").select("*").eq("merchant_id", mid).order("sort_order"),
        supabase.from("merchant_ctas").select("*").eq("merchant_id", mid),
        supabase.from("merchant_highlights").select("*").eq("merchant_id", mid).order("sort_order"),
      ]);

      setCategories((catRes.data as unknown as MerchantCategory[]) || []);
      setAmenities((amenRes.data as unknown as MerchantAmenity[]) || []);
      setHours((hoursRes.data as unknown as MerchantHours[]) || []);
      setMedia((mediaRes.data as unknown as MerchantMedia[]) || []);
      setCTAs((ctaRes.data as unknown as MerchantCTA[]) || []);
      setHighlights((hlRes.data as unknown as MerchantHighlight[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveProfile = async (updates: Partial<MerchantProfile>) => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("merchant_profiles")
      .update(updates as any)
      .eq("id", profile.id);
    if (error) {
      toast.error("Failed to save");
    } else {
      setProfile({ ...profile, ...updates } as MerchantProfile);
      toast.success("Saved");
    }
    setSaving(false);
  };

  const addCategory = async (name: string) => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("merchant_categories")
      .insert({ merchant_id: profile.id, category_name: name, sort_order: categories.length } as any)
      .select()
      .single();
    if (error) toast.error("Failed to add category");
    else { setCategories(prev => [...prev, data as unknown as MerchantCategory]); toast.success("Category added"); }
  };

  const removeCategory = async (id: string) => {
    await supabase.from("merchant_categories").delete().eq("id", id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addAmenity = async (name: string, icon?: string) => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("merchant_amenities")
      .insert({ merchant_id: profile.id, name, icon: icon || null, sort_order: amenities.length } as any)
      .select()
      .single();
    if (error) toast.error("Failed to add amenity");
    else setAmenities(prev => [...prev, data as unknown as MerchantAmenity]);
  };

  const removeAmenity = async (id: string) => {
    await supabase.from("merchant_amenities").delete().eq("id", id);
    setAmenities(prev => prev.filter(a => a.id !== id));
  };

  const saveHours = async (hoursData: { day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean }[]) => {
    if (!profile) return;
    // Delete existing and re-insert
    await supabase.from("merchant_hours").delete().eq("merchant_id", profile.id);
    const rows = hoursData.map(h => ({ merchant_id: profile.id, ...h }));
    if (rows.length > 0) {
      const { error } = await supabase.from("merchant_hours").insert(rows as any);
      if (error) toast.error("Failed to save hours");
      else { await fetchAll(); toast.success("Hours saved"); }
    }
  };

  const addMedia = async (url: string, mediaType: string = "photo", caption?: string) => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("merchant_media")
      .insert({ merchant_id: profile.id, url, media_type: mediaType, caption: caption || null, sort_order: media.length } as any)
      .select()
      .single();
    if (error) toast.error("Failed to add media");
    else setMedia(prev => [...prev, data as unknown as MerchantMedia]);
  };

  const removeMedia = async (id: string) => {
    await supabase.from("merchant_media").delete().eq("id", id);
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const addCTA = async (title: string, description?: string, buttonText?: string, buttonUrl?: string) => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("merchant_ctas")
      .insert({ merchant_id: profile.id, title, description: description || null, button_text: buttonText || "Learn More", button_url: buttonUrl || null } as any)
      .select()
      .single();
    if (error) toast.error("Failed to add CTA");
    else { setCTAs(prev => [...prev, data as unknown as MerchantCTA]); toast.success("CTA added"); }
  };

  const removeCTA = async (id: string) => {
    await supabase.from("merchant_ctas").delete().eq("id", id);
    setCTAs(prev => prev.filter(c => c.id !== id));
  };

  const addHighlight = async (name: string, icon?: string) => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("merchant_highlights")
      .insert({ merchant_id: profile.id, name, icon: icon || null, sort_order: highlights.length } as any)
      .select()
      .single();
    if (error) toast.error("Failed to add highlight");
    else setHighlights(prev => [...prev, data as unknown as MerchantHighlight]);
  };

  const removeHighlight = async (id: string) => {
    await supabase.from("merchant_highlights").delete().eq("id", id);
    setHighlights(prev => prev.filter(h => h.id !== id));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `merchant/${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("provider-media").upload(path, file);
    if (error) { toast.error("Upload failed"); return null; }
    const { data } = supabase.storage.from("provider-media").getPublicUrl(path);
    return data.publicUrl;
  };

  return {
    profile, categories, amenities, hours, media, ctas, highlights,
    loading, saving,
    saveProfile, addCategory, removeCategory, addAmenity, removeAmenity,
    saveHours, addMedia, removeMedia, addCTA, removeCTA, addHighlight, removeHighlight,
    uploadImage, refetch: fetchAll,
  };
}
