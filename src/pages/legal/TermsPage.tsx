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
  { title: "The service", body: ["FLEXS shows you customer requests in your trade and area. You choose which requests to unlock and quote on. A request does not guarantee a job."] },
  { title: "Your profile and claiming a business", body: ["Your profile must describe your real business. If you claim a directory listing, you confirm that you are authorised to represent that business. FLEXS may ask for proof and may reverse a claim that was made wrongly."] },
  { title: "Credits", body: [
    "Unlocking a customer's contact details costs credits. The cost is shown before you unlock. Unlocking the same request twice is not charged twice.",
    "Credits are bought in packs, priced in Canadian dollars, and paid through Stripe. Trial or bonus credits have no cash value. If a payment is refunded or disputed, the credits it bought are removed, and a disputed payment pauses purchases and unlocking until it is resolved.",
    "You can ask for credits back on a request, for example when the contact details are wrong. Each request is reviewed; an approved one returns the credits to your wallet. It is not a cash refund.",
  ] },
  { title: "Dealing with customers", body: ["Use a customer's details only to answer their request. Quote honestly, hold the licences your trade requires, and respect the law that applies to your work, including consumer protection and tax law. You are solely responsible for the work you do."] },
  { title: "No commission", body: ["FLEXS does not take a commission on the jobs you win."] },
  ...SHARED_END,
];

/** Terms page (frame 72:1751): two tabs, Customers and Professionals. */
export default function TermsPage() {
  const [params] = useSearchParams();
  const pro = params.get("for") === "professionals";
  const tab = (active: boolean) => `border-b-2 px-4 py-3 text-sm ${active ? "border-primary text-fx-ink" : "border-transparent text-fx-muted hover:text-fx-ink"}`;
  return <LegalPage
    title={pro ? "Terms & Conditions for Professionals" : "Terms & Conditions for Customers"} updated="20 November 2026" sections={pro ? PROFESSIONALS : CUSTOMERS}
    tabs={<nav aria-label="Terms for" className="mb-8 flex justify-center gap-2 border-b border-fx-line">
      <Link to="/terms" aria-current={pro ? undefined : "page"} className={tab(!pro)}>Customers</Link>
      <Link to="/terms?for=professionals" aria-current={pro ? "page" : undefined} className={tab(pro)}>Professionals</Link>
    </nav>} />;
}
