import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Mail, MessageSquareText, Search, Sparkles, Users, Wrench } from "lucide-react";
import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";
import { Button } from "@/components/ui/button";

type GroupId = "new" | "professionals" | "customers";
const GROUPS: { id: GroupId; title: string; blurb: string; icon: typeof Sparkles }[] = [
  { id: "new", title: "New to FLEXS", blurb: "Everything you need to know to get started", icon: Sparkles },
  { id: "professionals", title: "Professionals", blurb: "How FLEXS works for professionals", icon: Wrench },
  { id: "customers", title: "Customers", blurb: "Posting a request and getting quotes", icon: Users },
];

const articles: { group: GroupId; slug: string; title: string; body: string; to: string; label: string; sections?: [string, string][] }[] = [
  {group:'new',slug:'takatak',title:'How does FLEXS connect with TakaTak?',body:'FLEXS is an independent marketplace. Its server integration queues opaque attribution events for requests with a confirmed-email owner and a TakaTak click reference. The event includes identifiers and a timestamp, not names, contact details, messages, or documents. Administrators can inspect delivery history and retry exhausted events. A recorded delivery is not proof of current connectivity. Shared login, CRM synchronization, and private document transfer are separate features that are not enabled by this connection.',to:'/help',label:'Browse help topics'},
  {group:'customers',slug:'post-request',title:'How do I request quotes?',body:'Choose a service, answer the questions, and submit your contact details and location. Posting a request is free. Sign in with the same email and confirm it to see your request, compare quotes, and speak privately with professionals.',to:'/post-job',label:'Post a request'},
  {group:'customers',slug:'customer-responses',title:'How do I manage my request?',body:'Open My requests to view an existing request. You can reply to professionals who unlocked your contact, compare their quotes, accept one quote, or close the request. Closing stops new contact unlocks while keeping existing conversations available.',to:'/my-requests',label:'My requests'},
  {group:'professionals',slug:'credits',title:'How do professional credits work?',body:'Credits let professionals unlock a customer’s contact details. You can browse a privacy-protected preview first. The cost is shown on the request, and repeating the same unlock does not charge twice. Credit packages are priced in Canadian dollars. Your balance updates after payment is confirmed.',to:'/app/settings/credits',label:'Your credits'},
  {group:'professionals',slug:'credit-refunds',title:'How do I request a credit refund?',body:'Open a request you unlocked and use the credit refund form to explain the issue. The team reviews requests individually. An approved request returns lead credits to your wallet; it is not a bank-card refund. If you cannot access the request, create a support ticket with its reference.',to:'/app/responses',label:'Your unlocked requests'},
  {group:'new',slug:'verified',title:'What is a verified customer review?',body:'A verified FLEXS customer review comes from the confirmed-email owner of a request who accepted that professional’s quote. The customer can publish one review from their request. Professionals cannot delete verified reviews. This verifies the customer relationship; it does not certify completed work, qualifications, or licensing.',to:'/my-requests',label:'Open your request'},
  {group:'professionals',slug:'notifications',title:'How do reminders and notifications work?',body:'Create a follow-up reminder from a request or the Reminders screen. Due reminders and unread updates refresh while the professional app is open. You can turn message and reminder notifications on or off in Settings. Existing notices stay available. FLEXS also emails you about new requests in your trade, quotes and updates; you can turn these emails off in Settings. SMS and device push are not currently enabled.',to:'/app/reminders',label:'Your reminders'},
  {group:'new',slug:'account-access',title:'How do I reset my password or change my email?',body:'Use Forgot your password on the login page to request an email reset link. Choose a new password using that link; your sessions are signed out after the change. Account settings let you update your account name and request a confirmed email change. Your public business email is managed separately in your profile.',to:'/auth/forgot-password',label:'Reset your password'},
  {group:'new',slug:'contact-support',title:'How do I contact FLEXS support?',body:'Sign in and create a private support ticket. You can follow the conversation, reply, and close or reopen your ticket. Only your account and authorized FLEXS administrators can read it. Include the request or transaction reference when it helps explain your issue. Response times depend on the team’s availability.',to:'/support',label:'Create a support ticket'},
  {group:'customers',slug:'privacy',title:'How do I delete my account or request my data?',body:'To delete your account, sign in and open Settings, Account details, then Delete my account. Deletion is permanent: your profile, requests, messages, quotes, uploaded files and unused credits are removed. Payment records are kept by our payment processor as the law requires. To request a copy of your data, or if the delete button reports that your sign-in is used by another service, create a support ticket and choose Account deletion or data request.',to:'/app/settings/account',label:'Open account settings'},
  { group: 'new', slug: 'conversation-rules', title: 'Keeping conversations safe and professional', body: 'Messages on FLEXS exist so that a customer and a professional can agree on a job. These rules apply to everyone.', to: '/support', label: 'Report a conversation', sections: [
    ['Using messages the right way', 'Use messages to ask about the request, give a quote, agree on a time and share what is needed to do the job. Be polite and reply honestly, even when the answer is no.'],
    ['What is not allowed', 'Insults, threats, harassment or discrimination; advertising something unrelated to the request; asking for passwords, card numbers or identity documents; pretending to be someone else; sending the same message to many people.'],
    ['Protect your own information', 'Share only what the job needs. Never send card details, banking passwords or copies of identity documents in a message. A professional needs your address only once you have agreed to hire them.'],
    ['Paying for work', 'FLEXS does not handle payment between a customer and a professional. Agree on price and payment terms in writing before work starts, and be careful with any request to pay in full in advance.'],
    ['Reporting a problem', 'Open a support ticket and say which request and which person it concerns. Describe what happened in your own words. The FLEXS team reviews each report.'],
    ['What happens when the rules are broken', 'Depending on how serious it is, FLEXS can warn the account, remove content, or suspend or close the account, as set out in the Terms & Conditions.'],
  ] },
  { group: 'new', slug: 'review-rules', title: 'Which reviews are allowed on FLEXS?', body: 'A review on FLEXS comes from a customer who accepted a professional\'s quote. That is what "verified" means on a profile.', to: '/terms', label: 'Read the terms', sections: [
    ['Who can leave a review', 'Only the customer who posted a request, signed in with a confirmed email, and only for the professional whose quote they accepted. One review per request.'],
    ['What a review should contain', 'Your own experience of the work: quality, punctuality, communication and price compared with the quote. A rating and a few honest sentences are enough.'],
    ['What is not allowed', 'Reviews written by the professional, their staff or relatives; reviews given in exchange for a discount or payment; insults, discrimination or threats; personal details such as an address or a phone number; comments about anything other than the job.'],
    ['If you disagree with a review', 'Professionals can open a support ticket to report a review that breaks these rules, saying which rule and why. FLEXS does not remove a review only because it is negative.'],
  ] },
];

/** Soft gradient band with the help search, shared by every help screen. */
function HelpHero({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  return (
    <div className="bg-gradient-to-r from-[hsl(var(--fx-hero-from))] via-[hsl(var(--fx-hero-via))] to-[hsl(var(--fx-hero-to))] px-gutter py-16 md:py-24">
      <div className="relative mx-auto max-w-xl">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-fx-muted" aria-hidden="true" />
        <input aria-label="Search help topics" placeholder="Tell us how we can help..." value={search} onChange={e => onSearch(e.target.value)}
          className="h-[52px] w-full rounded-fx-xs border-0 bg-white pl-12 pr-4 text-base text-fx-ink placeholder:text-fx-secondary focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
    </div>
  );
}

function Crumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fx-ink">
      {items.map(([label, to], index) => <span key={label} className="flex items-center gap-3">{index > 0 && <span aria-hidden="true">/</span>}{to ? <Link to={to} className="hover:text-primary">{label}</Link> : <span aria-current="page">{label}</span>}</span>)}
    </nav>
  );
}

function GetInTouch() {
  return (
    <section className="mx-auto max-w-5xl px-gutter py-14">
      <h2 className="text-[28px] text-fx-ink">Get in touch</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Link to="/support" className="flex items-center gap-5 rounded-fx-xs border border-fx-line bg-white px-8 py-6 hover:border-primary">
          <Mail className="size-10 text-primary" strokeWidth={1.5} aria-hidden="true" />
          <span><span className="block text-2xl text-fx-ink">Contact us</span><span className="block text-fx-ink">Open a support ticket</span></span>
        </Link>
        <Link to="/help/credit-refunds" className="flex items-center gap-5 rounded-fx-xs border border-fx-line bg-white px-8 py-6 hover:border-primary">
          <MessageSquareText className="size-10 text-primary" strokeWidth={1.5} aria-hidden="true" />
          <span><span className="block text-2xl text-fx-ink">Credit refund</span><span className="block text-fx-ink">Ask for credits back on a request</span></span>
        </Link>
      </div>
    </section>
  );
}

function CannotFind() {
  return (
    <section className="bg-[hsl(var(--fx-callout))] px-gutter py-12 text-center">
      <h2 className="mx-auto max-w-sm text-[28px] leading-tight text-fx-ink md:max-w-none md:text-[36px]">Can't find what you're looking for?</h2>
      <Button asChild className="mt-6 h-11 rounded-fx-xs px-8 shadow-fx-button"><Link to="/support">Open support</Link></Button>
    </section>
  );
}

export default function HelpCenter() {
  const { slug } = useParams();
  const [search, setSearch] = useState("");
  const group = GROUPS.find(g => g.id === slug);
  const selected = articles.find(article => article.slug === slug);
  const term = search.trim().toLowerCase();
  const matches = term ? articles.filter(article => `${article.title} ${article.body}`.toLowerCase().includes(term)) : [];
  useEffect(() => { document.title = `${selected?.title ?? group?.title ?? "Help centre"} | FLEXS`; }, [selected, group]);

  const results = term && (
    <section className="mx-auto max-w-3xl px-gutter pt-10" aria-live="polite">
      <h2 className="text-xl text-fx-ink">{matches.length ? "Matching help topics" : "No help topic matches your search"}</h2>
      <ul className="mt-3 divide-y divide-fx-line">{matches.map(article => <li key={article.slug}><Link to={`/help/${article.slug}`} onClick={() => setSearch("")} className="block py-3 text-primary hover:underline">{article.title}</Link></li>)}</ul>
    </section>
  );

  let content;
  if (!slug) {
    content = <>
      <section className="mx-auto max-w-5xl px-gutter py-14">
        <h1 className="text-center text-[28px] text-fx-ink md:text-[44px]">Categories</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {GROUPS.map(({ id, title, blurb, icon: Icon }) => (
            <Link key={id} to={`/help/${id}`} className="rounded-fx-xs border border-fx-line bg-white px-6 py-8 text-center shadow-fx-card hover:border-primary">
              <Icon className="mx-auto size-14 text-primary" strokeWidth={1.25} aria-hidden="true" />
              <span className="mt-5 block text-xl text-fx-ink md:text-2xl">{title}</span>
              <span className="mt-3 block text-sm text-fx-ink md:text-base">{blurb}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="bg-fx-sunken px-gutter py-12">
        <h2 className="text-center text-[28px] text-fx-ink md:text-[44px]">Popular</h2>
        <ul className="mx-auto mt-6 max-w-5xl divide-y divide-fx-line md:grid md:grid-cols-3 md:gap-x-6 md:divide-y-0">
          {articles.map(article => <li key={article.slug} className="md:border-b md:border-fx-line"><Link to={`/help/${article.slug}`} className="block py-3.5 text-center text-primary hover:underline">{article.title}</Link></li>)}
        </ul>
      </section>
      <GetInTouch />
    </>;
  } else if (group) {
    content = <>
      <section className="mx-auto max-w-5xl px-gutter py-8">
        <Crumbs items={[["Help centre", "/help"], [group.title]]} />
        {/* Desktop (frame 39:2642): categories in a left column with a rule, the section's articles on the right. */}
        <div className="md:mt-8 md:grid md:grid-cols-[230px_1fr] md:gap-10">
          <div className="md:border-r md:border-fx-secondary md:pr-6">
            <h2 className="mt-10 text-2xl text-fx-ink md:mt-0">Categories</h2>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-b border-fx-secondary pb-8 md:flex-col md:gap-y-4 md:border-b-0 md:pb-0">
              {GROUPS.map(g => <Link key={g.id} to={`/help/${g.id}`} aria-current={g.id === group.id ? "page" : undefined} className={g.id === group.id ? "text-primary underline underline-offset-4" : "text-fx-ink hover:text-primary"}>{g.title}</Link>)}
            </div>
          </div>
          <div>
            <h1 className="mt-8 text-[28px] text-fx-ink md:mt-0 md:text-[32px]">{group.title}</h1>
            <ul className="mt-4 list-disc space-y-4 pl-5 text-fx-ink">
              {articles.filter(article => article.group === group.id).map(article => <li key={article.slug}><Link to={`/help/${article.slug}`} className="hover:text-primary">{article.title}</Link></li>)}
            </ul>
          </div>
        </div>
      </section>
      <GetInTouch />
    </>;
  } else if (selected) {
    const siblings = articles.filter(article => article.group === selected.group);
    const position = siblings.indexOf(selected);
    const previous = siblings[position - 1], next = siblings[position + 1];
    const parent = GROUPS.find(g => g.id === selected.group)!;
    const others = articles.filter(article => article.group !== selected.group).slice(0, 5);
    // Desktop (frame 37:1525): the section's article list sits in a left column with a rule; on phones it follows the article.
    content = <>
      <section className="mx-auto max-w-5xl px-gutter py-8">
        <Crumbs items={[["Help centre", "/help"], [parent.title, `/help/${parent.id}`], [selected.title]]} />
        <div className="mt-8 flex flex-col md:grid md:grid-cols-[230px_1fr] md:gap-10">
          <aside className="order-2 mt-12 md:order-none md:mt-0 md:border-r md:border-fx-secondary md:pr-6">
            <h2 className="text-lg text-fx-ink">Articles in this section</h2>
            <ul className="mt-3 space-y-3 pl-3">
              {siblings.map(article => <li key={article.slug}><Link to={`/help/${article.slug}`} aria-current={article === selected ? "page" : undefined} className={article === selected ? "text-primary" : "text-fx-ink hover:text-primary"}>{article.title}</Link></li>)}
            </ul>
            <Link to="/support" className="mt-6 inline-flex rounded-fx-xs bg-primary px-4 py-3 text-sm text-primary-foreground">Contact FLEXS customer support</Link>
          </aside>
          <div className="order-1 flex flex-col md:order-none">
            <article>
              <h1 className="text-[28px] leading-tight text-fx-ink md:text-[36px]">{selected.title}</h1>
              {selected.sections && (
                <nav aria-label="In this article" className="mt-6">
                  <h2 className="text-xl text-fx-ink">In this article</h2>
                  <ul className="mt-2 space-y-1.5">{selected.sections.map(([heading], index) => <li key={heading}><a href={`#section-${index + 1}`} className="text-sm text-primary hover:underline">{heading}</a></li>)}</ul>
                </nav>
              )}
              <p className="mt-6 leading-relaxed text-fx-secondary">{selected.body}</p>
              {selected.sections?.map(([heading, text], index) => (
                <section key={heading} id={`section-${index + 1}`} className="mt-8 scroll-mt-24">
                  <h2 className="text-xl text-fx-ink">{heading}</h2>
                  <p className="mt-2 leading-relaxed text-fx-secondary">{text}</p>
                </section>
              ))}
              <Button asChild className="mt-6 h-11 rounded-fx-xs px-6"><Link to={selected.to}>{selected.label}<ArrowRight className="ml-2 size-4" aria-hidden="true" /></Link></Button>
            </article>
            <div className="mt-10 border-t border-fx-secondary pt-10">
              <h2 className="text-[28px] leading-tight text-fx-ink">Contact FLEXS customer support</h2>
              <Link to="/support" className="mt-6 flex items-center gap-5 border-b border-fx-line pb-6">
                <Mail className="size-12 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <span><span className="block text-xl text-primary">Open a support ticket</span><span className="block text-fx-ink">A private conversation with the FLEXS team</span></span>
              </Link>
              <Link to="/help/credit-refunds" className="mt-6 flex items-center gap-5 border-b border-fx-line pb-6">
                <MessageSquareText className="size-12 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <span><span className="block text-xl text-primary">Request a credit refund</span><span className="block text-fx-ink">Reviewed one by one by the team</span></span>
              </Link>
            </div>
            <div className="mt-8 flex flex-col gap-6 md:flex-row md:justify-between">
              {previous ? <div><h2 className="text-lg font-bold text-fx-ink">Previous article</h2><Link to={`/help/${previous.slug}`} className="text-sm text-primary hover:underline">{previous.title}</Link></div> : <span className="hidden md:block" />}
              {next && <div className="md:text-right"><h2 className="text-lg font-bold text-fx-ink">Next article</h2><Link to={`/help/${next.slug}`} className="text-sm text-primary hover:underline">{next.title}</Link></div>}
            </div>
            <div className="mt-10 border-t border-fx-line pt-8">
              <h2 className="text-lg text-fx-ink">Related articles</h2>
              <ul className="mt-3 space-y-3">{others.map(article => <li key={article.slug}><Link to={`/help/${article.slug}`} className="text-fx-ink hover:text-primary">{article.title}</Link></li>)}</ul>
            </div>
          </div>
        </div>
      </section>
      <GetInTouch />
    </>;
  } else {
    content = (
      <section className="mx-auto max-w-3xl space-y-4 px-gutter py-14">
        <h1 className="text-[28px] text-fx-ink">This help topic is unavailable</h1>
        <p className="text-fx-secondary">Choose a current help topic or create a support ticket.</p>
        <Button asChild className="rounded-fx-xs"><Link to="/help">Browse help topics</Link></Button>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <HelpHero search={search} onSearch={setSearch} />
        {results}
        {content}
        <CannotFind />
      </main>
      <SiteFooter />
    </div>
  );
}
