import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";

interface Row { id: string; name: string; slug: string; parent_slug: string | null }

/** All services index (desktop frame 619:3252): every group as a heading with its services under it, from the live categories. */
export default function ServicesIndex() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    document.title = "All services | FLEXS";
    let active = true;
    supabase.from("service_categories").select("id, name, slug, parent_slug").eq("is_active", true).order("sort_order")
      .then(({ data, error }) => { if (!active) return; if (error) setFailed(true); setRows(data ?? []); });
    return () => { active = false; };
  }, []);
  const all = rows ?? [];
  const groups = all.filter(row => !row.parent_slug && all.some(child => child.parent_slug === row.slug));
  const single = all.filter(row => !row.parent_slug && !groups.includes(row));
  const item = "block rounded-fx-xs border border-fx-line px-4 py-3 text-primary hover:border-primary";
  return (
    <div className="min-h-screen bg-background text-fx-ink">
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-6xl px-gutter pb-20 pt-10">
        <h1 className="text-4xl md:text-[52px]">All services</h1>
        <p className="mt-3 max-w-2xl text-fx-secondary">Choose a service to describe your project and receive quotes. Posting a request is free.</p>
        {rows === null ? <p role="status" className="mt-10 text-fx-muted">Loading services…</p>
          : failed ? <p role="alert" className="mt-10">Services could not be loaded. Reload the page to try again.</p>
          : <>
            {groups.map(group => (
              <section key={group.id} className="mt-10" aria-labelledby={`g-${group.slug}`}>
                <h2 id={`g-${group.slug}`} className="text-2xl"><Link to={`/services/${group.slug}`} className="text-primary hover:underline">{group.name}</Link></h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {all.filter(child => child.parent_slug === group.slug).map(child => <li key={child.id}><Link to={`/services/${child.slug}`} className={item}>{child.name}</Link></li>)}
                </ul>
              </section>
            ))}
            {single.length > 0 && (
              <section className="mt-10" aria-labelledby="g-more">
                <h2 id="g-more" className="text-2xl text-primary">{groups.length ? "More services" : "Services"}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {single.map(row => <li key={row.id}><Link to={`/services/${row.slug}`} className={item}>{row.name}</Link></li>)}
                </ul>
              </section>
            )}
          </>}
      </main>
      <SiteFooter />
    </div>
  );
}
