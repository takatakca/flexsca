import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  hero_image: string | null;
}

export default function PostJob() {
  const navigate = useNavigate();
  const [params]=useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState((params.get("q") ?? "").slice(0,100));
  const [loading, setLoading] = useState(true);
  const [error,setError]=useState(false);
  const [retry,setRetry]=useState(0);

  useEffect(() => {
    let active=true;setLoading(true);setError(false);
    supabase
      .from("service_categories")
      .select("id, name, slug, icon, hero_image")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data,error }) => {
        if(!active)return;
        setError(!!error);
        if (data) setCategories(data);
        setLoading(false);
      });
    return ()=>{active=false;};
  }, [retry]);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-fx-ink">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-gutter pb-16 pt-12">
        <h1 className="text-4xl leading-[1.28]">What do you need help with?</h1>
        <p className="mt-3 text-lg text-fx-muted">Choose a service and answer a few questions. Posting is free.</p>
        <div className="relative mt-5">
          <label htmlFor="service-search" className="sr-only">Search for a service</label>
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fx-muted" />
          <Input id="service-search" placeholder="Search for a service..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-[50px] rounded-fx-xs border-fx-line pl-10 text-base" />
        </div>

        <h2 className="mt-14 text-center text-[28px]">{search.trim() ? "Matching services" : "All services"}</h2>
        {loading ? (
          <div className="flex justify-center py-12" role="status" aria-label="Loading services">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? <div role="alert" className="mt-8 rounded-fx-xs border border-fx-line p-6 text-center"><p>Services could not be loaded.</p><button className="mt-3 text-primary" onClick={()=>setRetry(v=>v+1)}>Retry services</button></div> : filtered.length === 0 ? (
          <p className="py-8 text-center text-fx-muted">No services found. Try a different search.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {filtered.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/post-job/${cat.slug}${params.get("location") ? `?${new URLSearchParams({location:params.get("location")!.slice(0,120)})}` : ""}`)}
                className="group overflow-hidden rounded-fx-xs border border-fx-line bg-card text-left"
              >
                <span className="relative block aspect-[380/232] bg-fx-sunken">
                  {cat.hero_image
                    ? <img src={cat.hero_image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    : <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-5xl">{cat.icon}</span>}
                </span>
                <span className="block px-3 py-3 text-sm leading-snug text-fx-ink md:px-[18px] md:py-4 md:text-lg">{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
