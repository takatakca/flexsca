import { useEffect } from "react";
import { useSeo } from "@/lib/seo";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MapPin, ShieldCheck, Wrench } from "lucide-react";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";
import { Button } from "@/components/ui/button";
import { SOURCES, getListing, getTrialTerms, quotable } from "@/lib/directory";

/** One business from the directory. Shows what the public register shows; never a phone, email or address. */
export default function BusinessListing() {
  const { slug = "" } = useParams();
  const { data: listing, isLoading, error } = useQuery({ queryKey: ["listing", slug], queryFn: () => getListing(slug) });
  const { data: terms } = useQuery({ queryKey: ["trial-terms"], queryFn: getTrialTerms, staleTime: 3_600_000 });
  const title = listing ? listing.other_name || listing.name : "";
  useEffect(() => { if (title) document.title = `${title}, ${listing?.city} | FLEXS`; }, [title, listing?.city]);
  // Only what the page itself shows: name, trade, town. No contact detail is published.
  useSeo({
    path: `/business/${slug}`,
    description: listing ? `${title}: ${listing.trade} in ${listing.city}, Quebec. Business listing in the FLEXS directory.` : undefined,
    data: listing ? { "@context": "https://schema.org", "@type": "LocalBusiness", name: title, description: listing.trade, url: `https://flexs.ca/business/${slug}`, address: { "@type": "PostalAddress", addressLocality: listing.city, addressRegion: "QC", addressCountry: "CA" } } : null,
  });
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-gutter py-8">
        <Link to="/directory" className="text-sm text-primary">← Business directory</Link>
        {isLoading ? <p role="status" className="mt-6 text-fx-muted">Loading…</p>
          : error ? <p role="alert" className="mt-6 text-destructive">{(error as Error).message}</p>
          : !listing ? <div className="mt-6 rounded-fx-md bg-fx-soft p-6"><h1 className="text-2xl text-fx-ink">Business not found</h1><p className="mt-2 text-fx-secondary">This listing does not exist or was removed at the owner's request.</p></div>
          : <>
            <header className="mt-4">
              <h1 translate="no" className="text-[28px] leading-tight text-fx-ink md:text-[36px]">{title}</h1>
              {listing.other_name && <p className="mt-1 text-sm text-fx-muted">Registered as {listing.name}</p>}
              <dl className="mt-5 grid gap-3 text-fx-secondary">
                <div className="flex items-center gap-3"><Wrench className="size-5 text-fx-muted" aria-hidden="true" /><dt className="sr-only">Trade</dt><dd>{listing.trade}{listing.activity && listing.activity.toLowerCase() !== listing.trade.toLowerCase() ? ` · ${listing.activity}` : ""}</dd></div>
                <div className="flex items-center gap-3"><MapPin className="size-5 text-fx-muted" aria-hidden="true" /><dt className="sr-only">Location</dt><dd>{listing.city}, QC{listing.region && listing.region !== listing.city ? ` · ${listing.region}` : ""}</dd></div>
                {listing.source === "rbq" && <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-fx-muted" aria-hidden="true" /><dt className="sr-only">Licence</dt><dd>RBQ licence {listing.source_ref}</dd></div>}
              </dl>
            </header>

            {quotable(listing.trade) && <section className="mt-8 rounded-fx-md border border-fx-line bg-white p-5">
              <h2 className="text-xl text-fx-ink">Looking for a professional in {listing.city}?</h2>
              <p className="mt-2 text-fx-secondary">Describe your project once. Professionals on FLEXS reply with quotes. Posting is free.</p>
              <Button asChild className="mt-4 h-[50px] rounded-fx-xs px-6 text-base"><Link to={listing.category_slug ? `/post-job/${listing.category_slug}` : "/post-job"}>Get quotes</Link></Button>
            </section>}

            {listing.status === "claimed"
              ? <p className="mt-6 flex items-center gap-2 text-success"><BadgeCheck className="size-5" aria-hidden="true" />This business is on FLEXS.</p>
              : <section className="mt-6 rounded-fx-md bg-fx-soft p-5">
                  <h2 className="text-xl text-fx-ink">Is this your business?</h2>
                  <p className="mt-2 text-fx-secondary">This listing comes from {SOURCES[listing.source].register} and has not been claimed. Claiming is free. Claim it to add your details, receive customer requests and reply to them{terms ? `, with a ${terms.trial_days}-day free trial${terms.trial_credits ? ` and ${terms.trial_credits} credits` : ""}` : ""}.</p>
                  <Button asChild variant="outline" className="mt-4 h-[50px] rounded-fx-xs px-6 text-base"><Link to={`/business/${listing.slug}/claim`}>Claim this business</Link></Button>
                </section>}
            <p className="mt-10 text-xs text-fx-muted">Source: {SOURCES[listing.source].credit}. FLEXS is not affiliated with the source and does not verify unclaimed businesses. To correct or remove this listing, <Link to="/support" className="underline">contact us</Link>.</p>
          </>}
      </main>
      <SiteFooter />
    </div>
  );
}
