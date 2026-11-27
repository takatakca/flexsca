import { supabase } from "@/integrations/supabase/client";
import type { CategoryCardData } from "@/components/fx/CategoryCard";

export type HomeCategory = CategoryCardData & { parent_slug: string | null };

/**
 * The home page's list of services. Shared so the app can ask for it as soon as it starts on "/",
 * while the page's own code is still downloading, instead of one after the other.
 */
export const homeCategoriesQuery = {
  queryKey: ["home-categories"] as const,
  staleTime: 60_000,
  queryFn: async (): Promise<HomeCategory[]> => {
    const result = await supabase.from("service_categories").select("id,name,slug,icon,parent_slug,hero_image").eq("is_active", true).order("sort_order");
    if (result.error) throw new Error("Unable to load services.");
    return result.data as HomeCategory[];
  },
};
