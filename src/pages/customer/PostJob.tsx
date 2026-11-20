import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  hero_image: string | null;
  parent_slug: string | null;
}

const STEPS: [string, string][] = [
  ["Tell us what you need", "Choose a service and answer a few questions about your project. It takes about a minute and it is free."],
  ["Receive quotes", "Professionals in your area see your request and reply with their quotes. You are notified here and in the app."],
  ["Choose your professional", "Compare the replies, read verified reviews and accept the quote that suits you. There is no obligation to hire."],
];

/** Search page (frame 569:2): hero with the two questions, how it works, popular categories, every service by group. */
export default function PostJob({ scope }: { scope?: { name: string; slug: string } } = {}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState((params.get("q") ?? "").slice(0, 100));
  const [where, setWhere] = useState((params.get("location") ?? "").slice(0, 120));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true; setLoading(true); setError(false);
    supabase.from("service_categories").select("id, name, slug, icon, hero_image, parent_slug").eq("is_active", true).order("sort_order")
      .then(({ data, error }) => { if (!active) return; setError(!!error); if (data) setCategories(data); setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  const open = (slug: string) => navigate(`/post-job/${slug}${where.trim() ? `?${new URLSearchParams({ location: where.trim().slice(0, 120) })}` : ""}`);
  const term = search.trim().toLowerCase();
  // On a category landing page (frame 617:2419) everything is limited to that category's services.
  const inScope = scope ? categories.filter(c => c.parent_slug === scope.slug) : categories;
  const filtered = (scope && !term ? inScope : categories).filter(c => c.name.toLowerCase().includes(term));
  const top = scope ? [] : categories.filter(c => !c.parent_slug);
  const groups = top.map(parent => ({ parent, children: categories.filter(c => c.parent_slug === parent.slug) })).filter(g => g.children.length > 0);
  const popular = inScope.filter(c => c.hero_image).slice(0, 9);
  const field = "h-[38px] md:h-[52px] w-full rounded-fx-xs border border-fx-line bg-white px-3 text-sm text-fx-ink placeholder:text-fx-muted focus:border-primary focus:outline-none";

  return (
    <div className="min-h-screen bg-background text-fx-ink">
      <SiteHeader />
      <main>
        <section className="bg-gradient-to-br from-[hsl(var(--fx-ink))] to-[hsl(var(--fx-ink-secondary))] px-gutter py-16 md:py-24">
          <h1 className="mx-auto w-fit max-w-full bg-fx-ink/55 px-4 py-1 text-center text-[32px] leading-[1.28] text-white [overflow-wrap:anywhere] md:max-w-3xl md:text-[52px]">Find {scope ? `${scope.name} ` : ""}professionals near you</h1>
          <form className="mx-auto mt-7 max-w-[312px] rounded-fx-xs border border-primary bg-white p-5 md:max-w-[500px] md:p-7" onSubmit={e => { e.preventDefault(); if (filtered.length === 1) open(filtered[0].slug); else document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }); }}>
            <label htmlFor="service-search" className="block text-base md:text-xl">What service do you need?</label>
            <input id="service-search" className={`${field} mt-2`} placeholder="Search for a service..." value={search} maxLength={100} onChange={e => setSearch(e.target.value)} />
            <label htmlFor="service-where" className="mt-4 block text-base md:text-xl">Where do you need it?</label>
            <input id="service-where" className={`${field} mt-2`} placeholder="Enter your postal code or town" value={where} maxLength={120} onChange={e => setWhere(e.target.value)} />
            <button type="submit" className="sr-only">Search</button>
          </form>
        </section>

        {scope && <nav aria-label="Breadcrumb" className="mx-auto flex max-w-3xl flex-wrap gap-x-2 px-gutter pt-5 text-xs text-fx-muted"><Link to="/post-job" className="hover:text-primary">All services</Link><span aria-hidden="true">/</span><span aria-current="page" className="text-fx-ink">{scope.name}</span></nav>}
        {!term && <>
          <section className="mx-auto max-w-5xl px-gutter py-16">
            <h2 className="text-[28px] leading-[1.4] md:text-[44px]">{scope ? `Need help with ${scope.name}?` : "Need help finding a professional?"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-fx-muted md:text-base md:leading-7">Describe your project once and get quotes from professionals on FLEXS.</p>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-fx-muted md:text-base md:leading-7">Not sure where to start? Tell us about your project and professionals who can do it reply to you. There is no pressure to hire: compare profiles, read verified reviews and ask questions before you decide.</p>
            <p className="mt-6 text-sm leading-6 text-fx-muted md:text-base">Posting a request is free.</p>
          </section>
          <section className="bg-fx-soft px-gutter py-10">
            <ol className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
              {STEPS.map(([title, text], index) => (
                <li key={title} className="bg-white px-5 py-6">
                  <span className="grid size-9 place-items-center rounded-full bg-fx-sunken text-lg text-primary" aria-hidden="true">{index + 1}</span>
                  <h3 className="mt-7 text-[28px] leading-tight">{title}</h3>
                  <p className="mt-4 text-sm leading-[26px] text-fx-muted">{text}</p>
                </li>
              ))}
            </ol>
            <div className="mx-auto mt-6 max-w-5xl md:text-center"><a href="#services" className="inline-flex min-h-11 items-center rounded-fx-xs bg-primary px-5 py-2.5 text-sm text-primary-foreground shadow-fx-button">Get quotes from professionals near you</a></div>
          </section>
        </>}

        <section id="services" className="mx-auto max-w-5xl scroll-mt-4 px-gutter pb-16 pt-14">
          {loading ? (
            <div className="flex justify-center py-12" role="status" aria-label="Loading services"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : error ? (
            <div role="alert" className="rounded-fx-xs border border-fx-line p-6 text-center"><p>Services could not be loaded.</p><button className="mt-3 text-primary" onClick={() => setRetry(v => v + 1)}>Retry services</button></div>
          ) : term ? <>
            <h2 className="text-[28px]">Matching services</h2>
            {filtered.length === 0 ? <p className="py-8 text-fx-muted">No services found. Try a different search.</p>
              : <ul className="mt-5 flex flex-wrap gap-2.5">{filtered.map(cat => <li key={cat.id}><button onClick={() => open(cat.slug)} className="rounded-fx-xs border border-primary px-3 py-2 text-sm text-primary hover:bg-primary hover:text-primary-foreground">{cat.name}</button></li>)}</ul>}
          </> : <>
            {popular.length > 0 && <h2 className="text-[28px] md:text-[44px]">Popular Categories</h2>}
            <div className="mt-5 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {popular.map(cat => (
                <button key={cat.id} onClick={() => open(cat.slug)} className="group overflow-hidden border border-fx-line bg-card text-left">
                  <span className="relative block aspect-[380/232] bg-fx-sunken">
                    <img src={cat.hero_image!} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  </span>
                  <span className="block px-[18px] py-4 text-lg leading-snug">{cat.name}</span>
                </button>
              ))}
            </div>

            <h2 className="mt-16 text-[28px] md:text-[44px]">All services</h2>
            {(scope ? [{ parent: { id: scope.slug, name: scope.name, slug: scope.slug }, children: inScope }] : groups.length ? groups : [{ parent: { id: "all", name: "", slug: "" }, children: categories }]).map(group => (
              <div key={group.parent.id} className="mt-6">
                {group.parent.name && <h3 className="text-2xl text-primary">{group.parent.name}</h3>}
                <ul className={scope ? "mt-4 grid gap-3 md:grid-cols-2" : "mt-4 flex flex-wrap gap-2.5"}>
                  {group.children.map(cat => <li key={cat.id}><button onClick={() => open(cat.slug)} className={`rounded-fx-xs border border-primary px-3 py-2 text-left text-sm text-primary hover:bg-primary hover:text-primary-foreground ${scope ? "w-full py-3 text-base" : ""}`}>{cat.name}</button></li>)}
                </ul>
              </div>
            ))}
            {groups.length > 0 && top.filter(c => !groups.some(g => g.parent.id === c.id)).length > 0 && (
              <div className="mt-6">
                <h3 className="text-2xl text-primary">More services</h3>
                <ul className="mt-4 flex flex-wrap gap-2.5">
                  {top.filter(c => !groups.some(g => g.parent.id === c.id)).map(cat => <li key={cat.id}><button onClick={() => open(cat.slug)} className="rounded-fx-xs border border-primary px-3 py-2 text-sm text-primary hover:bg-primary hover:text-primary-foreground">{cat.name}</button></li>)}
                </ul>
              </div>
            )}
          </>}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
