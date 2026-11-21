import { Link, useSearchParams } from "react-router-dom";
import LegalPage, { type LegalSection } from "@/components/fx/LegalPage";

const SHARED_END: LegalSection[] = [
  { title: "Accounts", body: ["You must be 18 or older and give accurate information. Keep your sign-in details to yourself; you are responsible for what is done from your account. You can delete your account at any time in Settings."] },
  { title: "What is not allowed", body: [[
    "false, misleading or duplicate requests, profiles, quotes or reviews;",
    "claiming a business you are not authorised to represent;",
    "harassment, discrimination, illegal content, or contacting people for anything other than the request;",
    "copying FLEXS content in bulk, or trying to break or bypass its security.",
  ], "We may remove content and suspend or close an account that breaks these rules."] },
  { title: "Our role and our liability", body: [
    "FLEXS provides the platform. It is not a party to the contract between a customer and a professional, does not supervise the work and does not guarantee its quality, price or timing. Businesses shown in the directory that have not joined FLEXS are listed from public sources and are not verified by FLEXS.",
    "To the extent the law allows, FLEXS is not liable for indirect losses, or for losses caused by the acts of another user. Nothing in these terms removes rights that Quebec's Consumer Protection Act gives you.",
  ] },
  { title: "Law and contact", body: ["These terms are governed by the laws of Quebec and of Canada that apply there. For any question or complaint, open a support ticket from the Help centre."] },
];

const CUSTOMERS: LegalSection[] = [
  { title: "The service", body: ["FLEXS lets you describe a job and receive quotes from independent professionals. Posting a request is free. FLEXS does not provide the services itself."] },
  { title: "Your request", body: ["When you post a request, professionals in the matching trade and area can see a preview. A professional who unlocks your request sees your name and contact details in order to quote. You can close your request at any time; closing stops new contacts."] },
  { title: "Quotes and hiring", body: ["A quote is the professional's own offer. You are free to accept one or none. If you hire a professional, the contract is between you and that professional, including price, schedule, warranty and payment. Check licences and insurance that matter for your job."] },
  { title: "Reviews", body: ["You may publish one review for a professional whose quote you accepted. Reviews must be honest and about your own experience."] },
  ...SHARED_END,
];

const PROFESSIONALS: LegalSection[] = [
  { title: "Definitions", body: ["In these terms, the following words have these meanings:"], terms: [
    ["FLEXS, we, us", "the FLEXS website and applications, operated by GROUPE TAKATAK, Montréal."],
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
  ...SHARED_END,
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
      <p>FLEXS is operated by GROUPE TAKATAK, Montréal, Quebec, Canada. You can contact us:</p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>by opening a <Link to="/support" className="text-fx-ink underline-offset-2 hover:underline">support ticket</Link>;</li>
        <li>through the <Link to="/help" className="text-fx-ink underline-offset-2 hover:underline">Help centre</Link>.</li>
      </ul>
    </div>
  </section>
);

/** Terms page. Customers: frame 72:1751. Professionals: frames 831:1370 (440 px) and 819:1415 (1440 px). */
export default function TermsPage() {
  const [params] = useSearchParams();
  const pro = params.get("for") === "professionals";
  const tab = (active: boolean) => `rounded-t-fx-xs px-6 py-4 text-base lg:px-8 lg:py-6 lg:text-xl ${active ? "bg-background text-fx-ink" : "text-fx-ink hover:bg-background/60"}`;
  return <LegalPage
    title={pro ? "Terms & Conditions for Professionals" : "Terms & Conditions for Customers"} updated="21 November 2026" sections={pro ? PROFESSIONALS : CUSTOMERS}
    notice={pro ? DRAFT_NOTICE : undefined}
    intro={pro ? "These terms apply to the services FLEXS makes available to professionals. They are an agreement between you and FLEXS. Read them before you create a professional account, claim a business listing or buy credits; by doing any of these you agree to them." : undefined}
    lead={pro ? ABOUT_US : undefined}
    tabs={<nav aria-label="Terms for" className="flex justify-center">
      <Link to="/terms" aria-current={pro ? undefined : "page"} className={tab(!pro)}>Customers</Link>
      <Link to="/terms?for=professionals" aria-current={pro ? "page" : undefined} className={tab(pro)}>Professionals</Link>
    </nav>} />;
}
