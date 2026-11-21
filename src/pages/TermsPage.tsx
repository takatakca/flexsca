import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="mb-10 text-center text-4xl text-fx-ink">Terms of Use</h1>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <p>Last updated: November 19, 2026. These terms apply to the FLEXS website (flexs.ca), its mobile applications and its related services (together, the "Service").</p>

          <h2 className="text-lg leading-snug text-fx-ink">1. Who we are</h2>
          <p>
            FLEXS is operated by Groupe TAKATAK inc. ("TAKATAK", "we", "our", "us"), Montréal, Québec, Canada. FLEXS is a marketplace
            and business directory that connects people looking for local services ("Customers") with independent businesses and
            professionals ("Professionals") across Québec.
          </p>
          <p>By using the Service, you agree to these terms. If you do not agree, do not use the Service.</p>

          <h2 className="text-lg leading-snug text-fx-ink">2. What FLEXS does — and does not do</h2>
          <p>
            FLEXS provides the platform: the directory, the request tools, messaging and the credit system. FLEXS is not a party to any
            contract between a Customer and a Professional, does not perform the services listed, and does not guarantee the quality,
            legality or completion of any work. Any agreement about a job is between the Customer and the Professional alone.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">3. The business directory</h2>
          <p>
            Directory listings are compiled from public sources, including the Régie du bâtiment du Québec (RBQ), Ville de Montréal
            open data (CC BY 4.0), the Office de la protection du consommateur (OPC), SIT Québec tourism data and OpenStreetMap
            (© OpenStreetMap contributors, available under the Open Database License). A listing shows a business's name, city and
            trade only — no telephone number, address, website or other contact detail is published.
          </p>
          <p>
            Listings are provided as received from those sources and may be incomplete or out of date. A business may claim its
            listing, correct it, or ask for its removal at any time through the claim flow on its listing page or by contacting us.
            Licences held by an individual under their own name are not listed by name, because the public file leaves those names blank.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">4. Accounts</h2>
          <p>
            You must give accurate information when you create an account and keep it up to date. You are responsible for activity
            under your account. Accounts are personal: do not share credentials or create an account for someone else. We may refuse,
            suspend or close an account that breaks these terms or is used fraudulently.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">5. Requests, responses and messages</h2>
          <p>
            Customers describe the work they need; Professionals may unlock a request with credits and respond. Contact details are
            shared between a Customer and a Professional only through the unlock flow. You must not use contact details obtained
            through FLEXS for spam, harassment or any purpose unrelated to the request.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">6. Credits and payments</h2>
          <p>
            Professionals use credits to unlock requests. A claimed business listing starts with a free trial (currently 30 days and
            20 credits; the current settings are shown in the product and may change). Additional credits are purchased through our
            payment provider, Stripe. Prices are shown in Canadian dollars before you confirm a purchase.
          </p>
          <p>
            Credits are a licence to use the Service: they have no monetary value, are not transferable, and cannot be exchanged for
            cash. Except where the law requires otherwise, credit purchases are final once the credits are delivered. If a payment is
            refunded, charged back or disputed, the credits bought with that payment are reversed, and a wallet may be frozen while a
            dispute is open.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">7. Acceptable use</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Do not copy the directory in bulk, except as the source licences allow (OpenStreetMap-derived data remains available on request under the ODbL).</li>
            <li>Do not post false, misleading or unlawful content, impersonate a business, or claim a listing that is not yours.</li>
            <li>Do not attempt to bypass the credit system, probe the platform's security, or disrupt the Service.</li>
          </ul>

          <h2 className="text-lg leading-snug text-fx-ink">8. Intellectual property</h2>
          <p>
            The FLEXS name, design and software belong to TAKATAK or its licensors. Content you submit stays yours; you grant us the
            licence needed to operate the Service (hosting, displaying and transmitting it for the purposes of the platform). Directory
            data keeps the licence of its source, as credited in section 3.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">9. Availability and liability</h2>
          <p>
            The Service is provided "as is". We work to keep it available and accurate but do not promise uninterrupted operation or
            error-free content. To the fullest extent permitted by the laws of Québec, our liability for any claim arising from the
            Service is limited to the amounts you paid to FLEXS in the twelve months before the claim. Nothing in these terms limits
            liability that cannot be limited by law.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">10. Suspension and termination</h2>
          <p>
            You may delete your account at any time from Settings › Account details. We may suspend or terminate access for breach of
            these terms, fraud, or legal obligation. Sections that by their nature should survive termination (payments, liability,
            governing law) survive.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">11. Changes to these terms</h2>
          <p>
            We may update these terms. The current version is always on this page, with its update date. Material changes will be
            announced on the Service. Continuing to use the Service after a change means you accept it.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">12. Governing law and contact</h2>
          <p>
            These terms are governed by the laws of Québec and the federal laws of Canada that apply there. Any dispute belongs to the
            courts of the judicial district of Montréal. Questions: support@takatak.ca.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
