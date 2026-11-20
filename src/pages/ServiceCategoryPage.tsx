import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";
import { Button } from "@/components/ui/button";
import PostJob from "@/pages/customer/PostJob";
import ServiceFlowModal from "@/components/customer/ServiceFlowModal";
import { TRADES, searchListings, type Listing } from "@/lib/directory";

interface Question { id: string; label: string; subtitle?: string; type: "radio" | "checkbox" | "textarea" | "location" | "select"; options: string[]; required: boolean; hasOther?: boolean; placeholder?: string }
type Category = Omit<Tables<"service_categories">, "questions"> & { questions: Question[] };

/** Largest Quebec cities, used for the links into the business directory. */
const CITIES = ["Montréal", "Québec", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Lévis", "Saguenay", "Trois-Rivières", "Terrebonne"];
/** Directory trade that matches a service category, when there is one. */
const DIRECTORY_TRADE: Record<string, (typeof TRADES)[number]> = {
  plumbing: "Plumbing", "electrical-work": "Electrical", "painting-decorating": "Construction and renovation",
  "wedding-catering": "Caterer", "commercial-catering": "Caterer", "private-chef-services": "Caterer",
  "personal-training": "Fitness and leisure", "event-and-travel-services": "Travel agency",
};

const article = (name: string) => (/^[aeiou]/i.test(name) ? "an" : "a");

/**
 * Service category page. A group of services uses the search layout (frame 617:2419).
 * A single service uses the landing layout of frames 644:2 (phone) and 28:49 (desktop):
 * photo hero with the "where" question, intro, three steps, cities, related services.
 */
export default function ServiceCategoryPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [parent, setParent] = useState<Category | null>(null);
  const [children, setChildren] = useState<Category[]>([]);
  const [related, setRelated] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [where, setWhere] = useState("");
  const [showFlow, setShowFlow] = useState(false);
  const [cityListings, setCityListings] = useState<{ city: string; rows: Listing[] }[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true); setShowFlow(false);
    supabase.from("service_categories").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      if (!active) return;
      const all = (data ?? []).map(row => ({ ...row, questions: (row.questions as unknown as Question[]) || [] }));
      const current = all.find(row => row.slug === slug) ?? null;
      setCategory(current);
      setChildren(all.filter(row => row.parent_slug === slug));
      setParent(current?.parent_slug ? all.find(row => row.slug === current.parent_slug) ?? null : null);
      // Services beside this one: same group, or the other top-level services.
      setRelated(all.filter(row => row.slug !== slug && (current?.parent_slug ? row.parent_slug === current.parent_slug : !row.parent_slug)).slice(0, 12));
      setLoading(false);
    });
    return () => { active = false; };
  }, [slug]);

  // Real businesses from the directory for the first three cities (frame 28:49, "Popular Cities").
  useEffect(() => {
    const trade = DIRECTORY_TRADE[slug];
    setCityListings([]);
    if (!trade) return;
    let active = true;
    void Promise.all(CITIES.slice(0, 3).map(city => searchListings({ name: "", city, trade, page: 0 }).then(result => ({ city, rows: result.rows.slice(0, 3) })).catch(() => ({ city, rows: [] }))))
      .then(result => { if (active) setCityListings(result.filter(item => item.rows.length > 0)); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => { if (category) document.title = `${category.name} professionals near you | FLEXS`; }, [category]);

  if (loading) return <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading service"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!category) {
    return (
      <div className="min-h-screen bg-background"><SiteHeader />
        <main className="mx-auto max-w-3xl px-gutter py-20 text-center">
          <h1 className="text-[28px] text-fx-ink">Service not found</h1>
          <p className="mt-3 text-fx-secondary">This service is not offered on FLEXS at the moment.</p>
          <Button asChild className="mt-6 rounded-fx-xs"><Link to="/post-job">Browse all services</Link></Button>
        </main><SiteFooter /></div>
    );
  }
  if (children.length > 0) return <PostJob scope={{ name: category.name, slug: category.slug }} />;

  const name = category.name;
  const trade = DIRECTORY_TRADE[category.slug];
  const start = () => setShowFlow(true);
  const steps: [string, string][] = [
    ["What are you looking for?", `Answer a few questions about the ${name.toLowerCase()} work you need. It takes about a minute and it is free.`],
    ["Get quotes", `Professionals who offer ${name.toLowerCase()} in your area see your request and reply with their quotes.`],
    ["Choose your professional", "Compare the replies, read verified reviews and accept the quote that suits you. There is no obligation to hire."],
  ];

  return (
    <div className="min-h-screen bg-background text-fx-ink">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-[hsl(var(--fx-ink))] to-[hsl(var(--fx-ink-secondary))] px-gutter py-16 md:py-24">
          {category.hero_image && <img src={category.hero_image} alt="" onError={e => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 -z-10 size-full object-cover" />}
          <h1 className="mx-auto w-fit max-w-full bg-fx-ink/55 px-4 py-1 text-center text-[32px] leading-[1.25] text-white [overflow-wrap:anywhere] md:max-w-3xl md:text-[44px]">Find {name} professionals near you</h1>
          <form className="mx-auto mt-6 max-w-[440px] rounded-fx-xs border border-primary bg-white p-5" onSubmit={e => { e.preventDefault(); start(); }}>
            <label htmlFor="service-where" className="block text-lg">Where do you need {name}?</label>
            <div className="mt-3 flex gap-2">
              <input id="service-where" value={where} onChange={e => setWhere(e.target.value)} maxLength={120} placeholder="Enter your postal code or town" className="h-11 min-w-0 flex-1 rounded-fx-xs border border-fx-line bg-white px-3 text-sm placeholder:text-fx-muted focus:border-primary focus:outline-none" />
              <Button type="submit" className="h-11 rounded-fx-xs px-4 shadow-fx-button">GO</Button>
            </div>
          </form>
        </section>

        <section className="mx-auto max-w-5xl px-gutter pb-14 pt-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap gap-x-2 text-sm text-fx-muted">
            <Link to="/post-job" className="hover:text-primary">All services</Link><span aria-hidden="true">/</span>
            {parent && <><Link to={`/services/${parent.slug}`} className="hover:text-primary">{parent.name}</Link><span aria-hidden="true">/</span></>}
            <span aria-current="page" className="text-fx-ink">{name}</span>
          </nav>
          <h2 className="mt-6 max-w-xl text-[28px] leading-[1.3] md:text-[40px]">Need help finding {article(name)} {name} professional?</h2>
          <div className="mt-4 max-w-xl space-y-5 text-sm leading-6 text-fx-muted">
            <p>Describe your project once and get quotes from {name} professionals on FLEXS.</p>
            <p>Not sure where to start? Tell us what you need and professionals who can do it reply to you. There is no pressure to hire: compare profiles, read verified reviews and ask questions before you decide.</p>
            <p>Posting a request is free.</p>
          </div>
          <Button onClick={start} className="mt-6 h-auto min-h-11 whitespace-normal rounded-fx-xs px-5 py-2.5 shadow-fx-button">Find {article(name)} {name} professional today</Button>
        </section>

        <section className="bg-fx-soft px-gutter py-10">
          <ol className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {steps.map(([title, text], index) => (
              <li key={title} className="bg-white px-5 py-6">
                <span className="grid size-9 place-items-center rounded-full bg-fx-sunken text-lg text-primary" aria-hidden="true">{index + 1}</span>
                <h3 className="mt-6 text-2xl leading-tight">{title}</h3>
                <p className="mt-3 text-sm leading-[26px] text-fx-muted">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-7 max-w-5xl text-center"><Button onClick={start} className="h-auto min-h-11 whitespace-normal rounded-fx-xs px-5 py-2.5 shadow-fx-button">Get quotes from {name} professionals near you</Button></p>
        </section>

        <section className="mx-auto max-w-5xl px-gutter py-14" aria-labelledby="cities-title">
          <h2 id="cities-title" className="text-[28px] md:text-[36px]">Popular cities</h2>
          <p className="mt-2 text-sm text-fx-muted">{trade ? `${trade} businesses listed in the FLEXS directory, by city.` : "Businesses listed in the FLEXS directory, by city."}</p>
          {cityListings.length > 0 && (
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {cityListings.map(({ city, rows }) => (
                <article key={city} className="border border-fx-line bg-white p-4">
                  <h3 className="text-2xl">{city}</h3>
                  <ul className="mt-3 divide-y divide-fx-line">
                    {rows.map(row => <li key={row.id}><Link to={`/business/${row.slug}`} className="block truncate py-3 text-sm text-fx-ink hover:text-primary">{row.other_name || row.name}</Link></li>)}
                  </ul>
                  <Button asChild className="mt-3 h-10 w-full rounded-fx-xs"><Link to={`/directory?${new URLSearchParams({ city, trade: trade! })}`}>Search {city}</Link></Button>
                </article>
              ))}
            </div>
          )}
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {CITIES.map(city => (
              <li key={city}><Link to={`/directory?${new URLSearchParams(trade ? { city, trade } : { city })}`} className="inline-flex items-center rounded-fx-xs bg-fx-soft px-3 py-2 text-sm text-primary hover:bg-primary hover:text-primary-foreground">{city}</Link></li>
            ))}
          </ul>
        </section>

        {related.length > 0 && (
          <section className="mx-auto max-w-5xl px-gutter pb-14" aria-labelledby="related-title">
            <h2 id="related-title" className="text-[28px] md:text-[36px]">Related services</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {related.filter(item => item.hero_image).slice(0, 3).map(item => (
                <Link key={item.id} to={`/services/${item.slug}`} className="group overflow-hidden border border-fx-line bg-card">
                  <span className="relative block aspect-[380/232] bg-fx-sunken"><img src={item.hero_image!} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /></span>
                  <span className="block px-[18px] py-4 text-lg leading-snug">{item.name}</span>
                </Link>
              ))}
            </div>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {related.map(item => <li key={item.id}><Link to={`/services/${item.slug}`} className="inline-block rounded-fx-xs border border-primary px-3 py-2 text-sm text-primary hover:bg-primary hover:text-primary-foreground">{item.name}</Link></li>)}
            </ul>
          </section>
        )}

        <section className="bg-[hsl(var(--fx-callout))] px-gutter py-12 text-center">
          <h2 className="text-[28px] leading-tight">Get quotes from {name} professionals near you</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fx-ink">Tell us about your project and professionals reply with their quotes.</p>
          <Button onClick={start} className="mt-6 h-11 rounded-fx-xs px-8 shadow-fx-button">Get Started</Button>
        </section>
      </main>
      <SiteFooter />
      {showFlow && (
        <ServiceFlowModal categoryId={category.id} categoryName={name} categorySlug={category.slug} questions={category.questions}
          heroImage={category.hero_image} initialLocation={where} onClose={() => setShowFlow(false)} />
      )}
    </div>
  );
}
