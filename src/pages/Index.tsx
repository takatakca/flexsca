import { useMemo, useRef, useState } from 'react';
import { servicePhoto } from "@/lib/service-photo";
import { useSeo } from '@/lib/seo';
import { matchServices } from '@/lib/service-search';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import SiteHeader from '@/components/fx/SiteHeader';
import SiteFooter from '@/components/fx/SiteFooter';
import CategoryCard, { SectionTitle, type CategoryCardData } from '@/components/fx/CategoryCard';

type Category = CategoryCardData & { parent_slug: string | null };
const POPULAR_PAGE = 3;

export default function Index() {
  const navigate = useNavigate();
  useSeo({
    path: "/",
    description: "Describe your project and get quotes from local professionals across Quebec. Browse the business directory, or join FLEXS as a professional.",
    data: { "@context": "https://schema.org", "@graph": [
      { "@type": "Organization", name: "FLEXS", url: "https://flexs.ca", logo: "https://flexs.ca/icons/icon-512.png", parentOrganization: { "@type": "Organization", name: "Groupe TAKATAK inc." }, areaServed: { "@type": "AdministrativeArea", name: "Québec" } },
      { "@type": "WebSite", name: "FLEXS", url: "https://flexs.ca", inLanguage: ["fr-CA", "en-CA"], potentialAction: { "@type": "SearchAction", target: "https://flexs.ca/post-job?q={search_term_string}", "query-input": "required name=search_term_string" } },
    ] },
  });
  const [service, setService] = useState('');
  const [location, setLocation] = useState('');
  const [popularPage, setPopularPage] = useState(0);
  const sections = useRef<Record<string, HTMLElement | null>>({});
  const categories = useQuery({ queryKey: ['home-categories'], queryFn: async () => {
    const result = await supabase.from('service_categories').select('id,name,slug,icon,parent_slug,hero_image').eq('is_active', true).order('sort_order');
    if (result.error) throw new Error('Unable to load services.'); return result.data as Category[];
  } });
  const reviews = useQuery({ queryKey: ['home-verified-reviews'], queryFn: async () => {
    const result = await supabase.from('provider_reviews_public').select('id,rating,review_text,reviewer_name').eq('verified', true).order('created_at', { ascending: false }).limit(3);
    if (result.error) throw new Error('Unable to load reviews.'); return result.data;
  } });
  // Suggestions while typing: services people can request directly (groups of services are left to the search page).
  const all = categories.data ?? [];
  const requestable = all.filter(c => !all.some(other => other.parent_slug === c.slug));
  const suggestions = service.trim().length >= 2 ? matchServices(requestable, service).slice(0, 6) : [];
  const [suggesting, setSuggesting] = useState(false);
  const openService = (slug: string) => navigate(`/post-job/${slug}${location.trim() ? `?${new URLSearchParams({ location: location.trim() })}` : ''}`);
  const start = (event: React.FormEvent) => {
    event.preventDefault();
    // One clear match goes straight to its questions; anything else shows the search page.
    if (suggestions.length === 1) { openService(suggestions[0].slug); return; }
    const query = new URLSearchParams();
    if (service.trim()) query.set('q', service.trim()); if (location.trim()) query.set('location', location.trim());
    navigate(`/post-job${query.size ? `?${query}` : ''}`);
  };
  const { topLevel, groups } = useMemo(() => {
    const all = categories.data ?? [];
    const top = all.filter(c => !c.parent_slug);
    return { topLevel: top, groups: top.map(parent => ({ parent, children: all.filter(c => c.parent_slug === parent.slug) })).filter(g => g.children.length > 0) };
  }, [categories.data]);
  const leaves = topLevel.filter(c => !groups.some(g => g.parent.id === c.id));
  const popularPages = Math.max(1, Math.ceil(leaves.length / POPULAR_PAGE));
  const popular = leaves.slice(popularPage * POPULAR_PAGE, popularPage * POPULAR_PAGE + POPULAR_PAGE);

  return <div className="min-h-screen bg-background text-fx-ink">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-white focus:p-3">Skip to content</a>
    <SiteHeader />
    <main id="main-content">
      <section className="mx-auto max-w-6xl px-gutter pt-12 pb-10 md:pt-20">
        <h1 className="text-4xl leading-[1.28] md:max-w-2xl md:text-[60px] md:leading-[1.15]">Find a professional for your project</h1>
        <p className="mt-3 text-lg text-fx-muted">Free quotes from local professionals</p>
        <form onSubmit={start} className="mt-5 grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
          <div className="grid grid-cols-[1.85fr_1fr] rounded-fx-xs border border-fx-line shadow-[inset_0_1px_2px_hsl(var(--fx-ink)/0.06)]">
            <div className="relative"><label htmlFor="home-service" className="sr-only">What do you need?</label>
              <input id="home-service" value={service} onChange={e => { setService(e.target.value); setSuggesting(true); }} onFocus={() => setSuggesting(true)} onBlur={() => window.setTimeout(() => setSuggesting(false), 150)}
                role="combobox" aria-expanded={suggesting && suggestions.length > 0} aria-controls="home-service-suggestions" aria-autocomplete="list" autoComplete="off"
                maxLength={100} placeholder="What do you need?" className="h-9 w-full bg-transparent px-2.5 text-xs text-fx-ink placeholder:text-fx-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-l-fx-xs" />
              {suggesting && suggestions.length > 0 && (
                <ul id="home-service-suggestions" role="listbox" aria-label="Matching services" className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-fx-xs border border-fx-line bg-background shadow-fx-card">
                  {suggestions.map(item => <li key={item.id} role="option" aria-selected="false"><button type="button" onMouseDown={event => event.preventDefault()} onClick={() => openService(item.slug)} className="block w-full px-3 py-2.5 text-left text-sm text-fx-ink hover:bg-fx-soft focus-visible:bg-fx-soft focus-visible:outline-none">{item.name}</button></li>)}
                </ul>
              )}</div>
            <div className="relative border-l border-fx-line"><label htmlFor="home-location" className="sr-only">Where is your project?</label>
              <MapPin aria-hidden="true" className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 fill-fx-ink text-background" />
              <input id="home-location" value={location} onChange={e => setLocation(e.target.value)} maxLength={120} placeholder="Postal code" className="h-9 w-full bg-transparent pl-8 pr-2 text-xs text-fx-ink placeholder:text-fx-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-r-fx-xs" /></div>
          </div>
          <Button type="submit" className="h-9 w-full md:w-40 rounded-fx-xs text-xs shadow-fx-button">Search</Button>
        </form>
        {leaves.length > 0 && <p className="mt-5 text-xs text-fx-muted">Popular: {leaves.slice(0, 3).map((c, i) => <span key={c.id}>{i > 0 && ', '}<Link to={`/services/${c.slug}`} className="hover:text-fx-ink">{c.name}</Link></span>)}</p>}
      </section>

      {categories.isLoading ? <p role="status" className="px-gutter text-fx-muted">Loading services…</p>
        : categories.error ? <div role="alert" className="mx-gutter rounded-fx-md border border-fx-line p-6"><p>Services could not be loaded.</p><Button variant="outline" onClick={() => void categories.refetch()} className="mt-3">Retry services</Button></div>
        : topLevel.length === 0 ? <p className="px-gutter text-fx-muted">Service listings are being updated. Visit the service finder to check availability.</p>
        : <>
          <section aria-label="Featured services" className="flex snap-x snap-mandatory gap-[18px] overflow-x-auto px-gutter pb-2 [scrollbar-width:none]">
            {leaves.slice(0, 8).map(c => (
              <Link key={c.id} to={`/services/${c.slug}`} className="relative h-[137px] w-[202px] shrink-0 snap-center overflow-hidden rounded-fx-xs bg-fx-sunken">
                {c.hero_image && <img src={servicePhoto(c.hero_image)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-8 text-xs text-white">{c.name}</span>
              </Link>
            ))}
          </section>

          {groups.length > 0 && <section className="pt-20" aria-labelledby="discover-title">
            <SectionTitle id="discover-title" center><span className="text-[32px] md:text-[44px]">Discover</span></SectionTitle>
            <div className="mt-7 flex snap-x gap-8 overflow-x-auto px-gutter pb-2 [scrollbar-width:none] md:justify-center">
              {groups.map(({ parent }) => (
                <button key={parent.id} type="button" onClick={() => sections.current[parent.slug]?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="grid shrink-0 snap-center justify-items-center gap-6 text-center">
                  <span aria-hidden="true" className="grid size-[70px] place-items-center rounded-fx-md border border-fx-line text-3xl">{parent.icon ?? '🛠️'}</span>
                  <span className="w-48 text-xl text-fx-ink">{parent.name}</span>
                </button>
              ))}
            </div>
          </section>}

          {groups.map(({ parent, children }) => (
            <section key={parent.id} ref={node => { sections.current[parent.slug] = node; }} className="mx-auto max-w-6xl scroll-mt-24 px-gutter pt-20" aria-labelledby={`group-${parent.slug}`}>
              <SectionTitle id={`group-${parent.slug}`} action={<Link to={`/services/${parent.slug}`} className="text-base text-fx-muted hover:text-fx-ink">View All</Link>}>{parent.name}</SectionTitle>
              <div className="mt-8 grid gap-5 md:grid-cols-3">{children.slice(0, 3).map(c => <CategoryCard key={c.id} category={c} />)}</div>
              <p className="mt-9 text-center md:hidden"><Link to={`/services/${parent.slug}`} className="text-lg text-fx-muted hover:text-fx-ink">View All</Link></p>
            </section>
          ))}

          {leaves.length > 0 && <section className="mx-auto max-w-6xl px-gutter pt-20" aria-labelledby="popular-title">
            <SectionTitle id="popular-title">Most Popular Categories</SectionTitle>
            <div className="mt-8 grid gap-5 md:grid-cols-3">{popular.map(c => <CategoryCard key={c.id} category={c} />)}</div>
            {popularPages > 1 && <div className="mt-9 flex justify-center gap-2.5">
              <button type="button" aria-label="Previous categories" disabled={popularPage === 0} onClick={() => setPopularPage(p => p - 1)} className="grid size-[38px] place-items-center rounded-fx-sm border border-fx-line text-primary disabled:bg-fx-sunken disabled:border-transparent"><ArrowLeft className="size-5" /></button>
              <button type="button" aria-label="Next categories" disabled={popularPage >= popularPages - 1} onClick={() => setPopularPage(p => p + 1)} className="grid size-[38px] place-items-center rounded-fx-sm border border-fx-line text-primary disabled:bg-fx-sunken disabled:border-transparent"><ArrowRight className="size-5" /></button>
            </div>}
          </section>}
        </>}

      {!!reviews.data?.length && <section className="mt-24 bg-fx-soft px-gutter py-14 text-center" aria-label="Verified customer reviews">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">{reviews.data.map(review => (
          <figure key={review.id}><blockquote className="text-lg leading-relaxed text-fx-ink">{review.review_text || 'This customer left a rating.'}</blockquote>
            <figcaption className="mt-3 text-sm text-fx-ink">{review.reviewer_name || 'FLEXS customer'} <span className="text-fx-muted">· verified customer, {review.rating} out of 5</span></figcaption></figure>
        ))}</div>
      </section>}

      <section className="mx-auto max-w-6xl px-gutter py-16">
        <Link to="/pro" className="block rounded-fx-xs bg-accent px-6 py-5 text-center text-sm text-primary">Are you a professional? Register now to find new customers through FLEXS.</Link>
      </section>
    </main>
    <SiteFooter />
  </div>;
}
