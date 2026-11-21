import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, CalendarClock, ClipboardList, Coins, MessageSquare, MessagesSquare, ShieldCheck, Store, Timer } from "lucide-react";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const BENEFITS = [
  { icon: Timer, title: "See requests that fit", points: ["Requests in your trade and area", "Preview each request for free", "The credit cost is shown before you unlock"], to: "/help/credits", label: "How lead credits work" },
  { icon: MessagesSquare, title: "Win new clients", points: ["Choose the requests worth your time", "Unlock the customer's contact details", "Send a structured quote in CAD"], to: "/auth/welcome", label: "Create an account" },
  { icon: BadgeCheck, title: "Grow your business", points: ["Keep 100% of what you earn", "No commission on your jobs", "Verified reviews from customers who hired you"], to: "/directory", label: "Claim your business" },
];
const PANEL = [
  { icon: ClipboardList, title: "Choose your opportunities", text: "Review the service, location, timing, and credit cost." },
  { icon: MessageSquare, title: "Start the conversation", text: "Unlock a contact and send a structured CAD quote." },
  { icon: CalendarClock, title: "Keep things moving", text: "Set follow-ups and see customer replies in your account." },
];

/** Professional landing page, desktop frame 424:2 and its phone version: hero with service search and popular services, three benefit columns, marketplace facts. */
export default function ProLanding() {
  const navigate = useNavigate();
  const [service, setService] = useState("");
  const [services, setServices] = useState<{ name: string; slug: string }[]>([]);
  const [facts, setFacts] = useState<{ services: number; listings: number } | null>(null);

  useEffect(() => {
    let active = true;
    const db = supabase as unknown as SupabaseClient;
    void Promise.all([
      supabase.from("service_categories").select("name, slug", { count: "exact" }).eq("is_active", true).order("sort_order").limit(12),
      db.from("business_listings").select("id", { count: "estimated", head: true }),
    ]).then(([categories, listings]) => {
      if (!active) return;
      setServices(categories.data ?? []);
      if (categories.count && listings.count) setFacts({ services: categories.count, listings: listings.count });
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background text-fx-ink">
      <SiteHeader />
      <main>
        <section className="bg-fx-soft">
          <div className="mx-auto grid max-w-6xl items-start gap-12 px-gutter py-14 lg:grid-cols-[1.15fr_1fr] lg:py-20">
            <div>
              <h1 className="text-4xl leading-[1.3] lg:text-[46px]">Great work deserves <span className="text-primary">a next opportunity.</span></h1>
              <p className="mt-3 text-base text-fx-muted">Customers post their projects on FLEXS. Choose the requests that fit and reply with your quote.</p>
              <form className="mt-6 flex max-w-xl gap-2" onSubmit={e => { e.preventDefault(); navigate("/auth/welcome"); }}>
                <label htmlFor="pro-service" className="sr-only">What service do you provide?</label>
                <input id="pro-service" value={service} onChange={e => setService(e.target.value)} maxLength={100} placeholder="What service do you provide?" className="h-[52px] min-w-0 flex-1 rounded-fx-xs border border-fx-muted bg-white px-4 text-base placeholder:text-fx-muted focus:border-primary focus:outline-none" />
                <Button type="submit" className="h-[52px] rounded-fx-xs px-5 text-base shadow-fx-button">GO</Button>
              </form>
              {services.length > 0 && <>
                <h2 className="mt-8 text-sm text-fx-ink">Popular services</h2>
                <ul className="mt-3 grid max-w-xl grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-fx-secondary">
                  {services.map(item => <li key={item.slug}><Link to={`/services/${item.slug}`} className="hover:text-primary">{item.name}</Link></li>)}
                </ul>
              </>}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="h-12 rounded-fx-xs px-6"><Link to="/auth/welcome">Create your professional account <ArrowRight className="ml-2 size-4" aria-hidden="true" /></Link></Button>
                <Button asChild variant="outline" className="h-12 rounded-fx-xs bg-white"><Link to="/app/dashboard">Open workspace <ArrowUpRight className="ml-2 size-4" aria-hidden="true" /></Link></Button>
              </div>
              <p className="mt-4 text-xs text-fx-muted">Contact access uses credits. A customer request does not guarantee a job.</p>
            </div>
            <div className="rounded-fx-md bg-primary p-8 text-white sm:p-10">
              <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.15em] text-white/90">Your working day, simplified</p><ShieldCheck className="size-5 text-white/90" aria-hidden="true" /></div>
              <h2 className="mb-6 mt-8 text-3xl leading-tight">One workspace.<br />A clearer next step.</h2>
              {PANEL.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 border-t border-white/15 py-5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-fx-sm bg-white/10"><Icon className="size-5 text-white/90" aria-hidden="true" /></div>
                  <div><h3 className="text-sm">{title}</h3><p className="mt-2 text-xs leading-relaxed text-white/90">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-gutter py-16 md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, points, to, label }) => (
            <article key={title}>
              <span className="grid size-10 place-items-center rounded-fx-xs border border-fx-line"><Icon className="size-5 text-fx-ink" aria-hidden="true" /></span>
              <h2 className="mt-5 text-lg">{title}</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-fx-secondary marker:text-fx-muted">{points.map(point => <li key={point}>{point}</li>)}</ul>
              <Link to={to} className="mt-5 inline-flex h-10 items-center gap-2 rounded-fx-xs border border-fx-line px-4 text-sm text-primary hover:border-primary">{label}{to === "/help/credits" && <Coins className="size-4" aria-hidden="true" />}</Link>
            </article>
          ))}
        </section>

        {facts && (
          <section className="bg-fx-soft">
            <div className="mx-auto grid max-w-6xl items-center gap-8 px-gutter py-14 md:grid-cols-[1fr_1.2fr]">
              <div>
                <h2 className="text-[28px] leading-tight">Your business may already be listed</h2>
                <p className="mt-3 text-fx-ink">FLEXS lists Quebec businesses from public registers. Find yours, claim it for free and start with a trial.</p>
                <Button asChild className="mt-5 h-11 rounded-fx-xs px-6 shadow-fx-button"><Link to="/directory">Find my business</Link></Button>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <div className="border border-fx-line bg-white px-6 py-8 text-center"><Store className="mx-auto size-9 rounded-fx-xs border border-fx-line p-2 text-primary" aria-hidden="true" /><dd className="mt-4 text-[28px]">{facts.listings.toLocaleString("en-CA")}</dd><dt className="mt-1 text-sm">Quebec businesses listed</dt></div>
                <div className="border border-fx-line bg-white px-6 py-8 text-center"><BriefcaseBusiness className="mx-auto size-9 rounded-fx-xs border border-fx-line p-2 text-primary" aria-hidden="true" /><dd className="mt-4 text-[28px]">{facts.services}</dd><dt className="mt-1 text-sm">services customers can request</dt></div>
              </dl>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-gutter py-14">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-fx-md border border-fx-line bg-primary/5 p-7">
            <div><h2 className="text-xl">Looking beyond your next lead?</h2><p className="mt-2 text-sm text-fx-secondary">FLEXS remains independent. Explore TakaTak's services for your wider growth plans.</p></div>
            <Button asChild variant="outline" className="rounded-fx-xs bg-white"><a href="https://takatak.ca/services/lead-generation" target="_blank" rel="noopener noreferrer">Explore TakaTak <ArrowUpRight className="ml-2 size-4" aria-hidden="true" /></a></Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
