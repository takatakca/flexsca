import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search } from "lucide-react";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE, TRADES, searchListings } from "@/lib/directory";

/** Public directory of Quebec businesses, including those that have not joined FLEXS yet. */
export default function Directory() {
  const [params, setParams] = useSearchParams();
  const applied = { name: params.get("q") ?? "", city: params.get("city") ?? "", trade: params.get("trade") ?? "", page: Math.max(0, Number(params.get("page")) || 0) };
  const [name, setName] = useState(applied.name);
  const [city, setCity] = useState(applied.city);
  const [trade, setTrade] = useState(applied.trade);
  useEffect(() => { document.title = "Quebec business directory | FLEXS"; }, []);
  const { data, isLoading, error } = useQuery({ queryKey: ["directory", applied], queryFn: () => searchListings(applied), placeholderData: previous => previous });
  const go = (next: Partial<typeof applied>) => {
    const merged = { ...applied, ...next }; const out = new URLSearchParams();
    if (merged.name) out.set("q", merged.name); if (merged.city) out.set("city", merged.city);
    if (merged.trade) out.set("trade", merged.trade); if (merged.page) out.set("page", String(merged.page));
    setParams(out);
  };
  const pages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const field = "h-[50px] w-full rounded-fx-xs border border-fx-line bg-white px-4 text-base text-fx-ink placeholder:text-fx-muted focus:border-primary focus:outline-none";
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-gutter py-8">
        <h1 className="text-[28px] leading-tight text-fx-ink md:text-[36px]">Quebec business directory</h1>
        <p className="mt-2 text-fx-secondary">Restaurants, shops, hotels, garages, services and licensed contractors across the province. Find one near you, or claim your own business for free.</p>
        <form className="mt-6 flex flex-col gap-3 md:grid md:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={e => { e.preventDefault(); go({ name, city, trade, page: 0 }); }}>
          <label className="sr-only" htmlFor="dir-name">Business name</label>
          <input id="dir-name" className={field} placeholder="Business name" value={name} maxLength={60} onChange={e => setName(e.target.value)} />
          <label className="sr-only" htmlFor="dir-city">City</label>
          <input id="dir-city" className={field} placeholder="City, for example Montréal" value={city} maxLength={60} onChange={e => setCity(e.target.value)} />
          <label className="sr-only" htmlFor="dir-trade">Trade</label>
          <select id="dir-trade" className={field} value={trade} onChange={e => setTrade(e.target.value)}>
            <option value="">All trades</option>
            {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button type="submit" className="h-[50px] rounded-fx-xs px-6 text-base"><Search className="mr-2 size-4" aria-hidden="true" />Search</Button>
        </form>

        <section aria-live="polite" className="mt-8">
          {error ? <p role="alert" className="text-destructive">{(error as Error).message}</p>
            : isLoading ? <p role="status" className="text-fx-muted">Loading businesses…</p>
            : !data?.rows.length ? <p className="rounded-fx-md bg-fx-soft p-6 text-fx-secondary">No business matches this search. Try a shorter name or another city.</p>
            : <>
              <p className="mb-3 text-sm text-fx-muted">About {data.total.toLocaleString("en-CA")} businesses</p>
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {data.rows.map(row => (
                  <li key={row.id} className="min-w-0 rounded-fx-xs border border-fx-line bg-white p-5 shadow-fx-card">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="min-w-0 break-words text-xl text-fx-ink">{row.other_name || row.name}</h2>
                      <span className={`shrink-0 rounded-fx-pill px-3 py-1 text-xs ${row.status === "claimed" ? "bg-success/10 text-success" : "bg-fx-soft text-fx-secondary"}`}>{row.status === "claimed" ? "On FLEXS" : "Not claimed"}</span>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-fx-ink"><MapPin className="size-4 shrink-0" aria-hidden="true" />{row.city}, QC{row.region && row.region !== row.city ? ` · ${row.region}` : ""}</p>
                    <p className="mt-3 text-fx-ink"><span className="font-bold">Category: </span>{row.trade}</p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <Link to={`/business/${row.slug}`} className="text-lg text-primary hover:underline">View profile ›</Link>
                      <Button asChild className="h-11 rounded-fx-xs px-6 shadow-fx-button"><Link to={row.category_slug ? `/post-job/${row.category_slug}` : "/post-job"}>Request quote</Link></Button>
                    </div>
                  </li>
                ))}
              </ul>
              {pages > 1 && <nav aria-label="Directory pages" className="mt-6 flex items-center justify-between">
                <Button variant="outline" className="rounded-fx-xs" disabled={applied.page === 0} onClick={() => go({ page: applied.page - 1 })}>Previous</Button>
                <span className="text-sm text-fx-muted">Page {applied.page + 1} of {pages.toLocaleString("en-CA")}</span>
                <Button variant="outline" className="rounded-fx-xs" disabled={applied.page + 1 >= pages} onClick={() => go({ page: applied.page + 1 })}>Next</Button>
              </nav>}
            </>}
        </section>
        <p className="mt-10 text-xs text-fx-muted">Contains open data from the Régie du bâtiment du Québec, the Office de la protection du consommateur, the Ministère du Tourisme (SIT Québec) and the Ville de Montréal, licensed under CC BY 4.0, and data © OpenStreetMap contributors (Open Database License). Each business page names its source. FLEXS is not affiliated with them. To correct or remove a listing, <Link to="/support" className="underline">contact us</Link>.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
