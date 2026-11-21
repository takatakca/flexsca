import { Link } from "react-router-dom";
import LegalPage, { type LegalSection } from "@/components/fx/LegalPage";

const PROFESSIONALS: LegalSection[] = [
  { title: "Definitions", body: ["In these terms, the following words have these meanings:"], terms: [
    ["FLEXS, we, us", "the FLEXS website and applications, operated by Groupe TAKATAK inc., Montréal."],
    ["You, the Professional", "the person or business offering services to customers through FLEXS."],
    ["Customer", "a person or business that posts a request on FLEXS."],
    ["Request", "a job described by a customer, shown to professionals in the matching trade and area."],
    ["Unlock", "spending credits to see the contact details attached to a request."],
    ["Credits", "units bought in packs, or granted as a trial or bonus, that are spent to unlock requests."],
    ["Trial", "the free period and free credits granted when a business listing is claimed and approved."],
    ["Listing", "the public page of a business in the FLEXS directory, whether or not the business has joined."],
    ["Claim", "a request by a professional to take over the listing of the business they represent."],
    ["Quote", "the professional's own offer to a customer, made through FLEXS."],
  ] },
  { title: "The service", body: ["FLEXS shows you customer requests in your trade and area. You choose which requests to unlock and quote on. A request does not guarantee a job."] },
  { title: "Your profile and claiming a business", body: ["Your profile must describe your real business. If you claim a directory listing, you confirm that you are authorised to represent that business. FLEXS may ask for proof and may reverse a claim that was made wrongly."] },
  { title: "Credits", body: [
    "Signing up and a basic listing are free. Unlocking a customer's contact details costs credits. The cost is shown before you unlock. Unlocking the same request twice is not charged twice.",
    "Credits are bought in packs, priced in Canadian dollars, and paid through Stripe. Trial or bonus credits have no cash value. If a payment is refunded or disputed, the credits it bought are removed, and a disputed payment pauses purchases and unlocking until it is resolved.",
    "You can ask for credits back on a request, for example when the contact details are wrong. Each request is reviewed; an approved one returns the credits to your wallet. It is not a cash refund.",
  ] },
  { title: "Dealing with customers", body: ["Use a customer's details only to answer their request. Quote honestly, hold the licences your trade requires, and respect the law that applies to your work, including consumer protection and tax law. You are solely responsible for the work you do."] },
  { title: "No commission", body: ["FLEXS does not take a commission on the jobs you win."] },
];

/** Shown on the professionals' terms until the owner supplies the final legal text. */
const DRAFT_NOTICE = (
  <p role="note" className="mt-6 rounded-fx-xs border border-fx-line bg-[hsl(var(--fx-callout))] px-4 py-3 text-sm leading-6 text-fx-ink lg:mt-8 lg:px-6 lg:py-5 lg:text-lg">
    <strong className="font-medium">Draft awaiting the owner.</strong> This page is a working draft written for FLEXS. It has not yet been reviewed by a lawyer or approved by the owner, and the final text will replace it.
  </p>
);

const ABOUT_US = (
  <section className="mt-8 lg:mt-12">
    <h2 className="text-center text-lg leading-snug lg:text-left lg:text-[32px]">About us</h2>
    <div className="mt-3 space-y-3 text-sm leading-6 text-fx-secondary lg:mt-5 lg:text-xl lg:leading-[1.7]">
      <p>FLEXS is operated by Groupe TAKATAK inc., Montréal, Québec, Canada. You can contact us:</p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>by opening a <Link to="/support" className="text-fx-ink underline-offset-2 hover:underline">support ticket</Link>;</li>
        <li>by email at support@takatak.ca.</li>
      </ul>
    </div>
  </section>
);

/** Tab band of the terms frames (831:1370, 819:1415), shared by the Terms of Use and this page. */
export function TermsTabs({ pro }: { pro: boolean }) {
  const tab = (active: boolean) => `rounded-t-fx-xs px-6 py-4 text-base lg:px-8 lg:py-6 lg:text-xl ${active ? "bg-background text-fx-ink" : "text-fx-ink hover:bg-background/60"}`;
  return (
    <nav aria-label="Terms" className="flex justify-center">
      <Link to="/terms" aria-current={pro ? undefined : "page"} className={tab(!pro)}>Terms of use</Link>
      <Link to="/terms?for=professionals" aria-current={pro ? "page" : undefined} className={tab(pro)}>Professionals</Link>
    </nav>
  );
}

/** Supplement for professionals (frames 831:1370 at 440 px and 819:1415 at 1440 px). The owner's Terms of Use stay the governing text. */
export default function ProTermsPage() {
  return <LegalPage
    title="Terms & Conditions for Professionals" updated="21 November 2026" sections={PROFESSIONALS}
    notice={DRAFT_NOTICE}
    intro="This page explains how the FLEXS Terms of Use apply to professionals: requests, credits and business listings. It adds to the Terms of Use and does not replace them; if the two differ, the Terms of Use apply."
    lead={ABOUT_US}
    tabs={<TermsTabs pro />} />;
}
