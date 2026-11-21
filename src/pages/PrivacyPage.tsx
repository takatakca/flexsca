import SiteHeader from "@/components/fx/SiteHeader";
import SiteFooter from "@/components/fx/SiteFooter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="mb-10 text-center text-4xl text-fx-ink">Privacy Policy</h1>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <p>Last updated: November 19, 2026. This policy explains how FLEXS (flexs.ca) handles personal information, in accordance with Québec's Act respecting the protection of personal information in the private sector (Law 25) and applicable Canadian law.</p>

          <h2 className="text-lg leading-snug text-fx-ink">1. Who is responsible</h2>
          <p>
            FLEXS is operated by Groupe TAKATAK inc., Montréal, Québec, Canada. The person in charge of the protection of personal
            information is Pierre Lévesque. You can reach him through support@takatak.ca.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">2. What we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account information</strong>: your name, email address, phone number and password (stored hashed by our authentication provider).</li>
            <li><strong>Professional profile</strong>: the business details, trades, service areas and photos you choose to publish.</li>
            <li><strong>Requests and messages</strong>: the jobs you post, the photos you attach, and the messages exchanged through the platform.</li>
            <li><strong>Payment information</strong>: payments are processed by Stripe. Your card number goes to Stripe and is never stored on our servers; we keep the transaction records needed for accounting and fraud prevention.</li>
            <li><strong>Technical information</strong>: IP address, device and browser information, and usage logs needed to run and secure the Service.</li>
            <li><strong>Directory data</strong>: business name, city, trade and licence number from public sources (RBQ, Ville de Montréal open data, OPC, SIT Québec, OpenStreetMap). The directory publishes no personal contact details, and licences held by an individual under their own name are not listed by name.</li>
          </ul>

          <h2 className="text-lg leading-snug text-fx-ink">3. Why we use it</h2>
          <p>
            To operate the marketplace (accounts, requests, unlocking, messaging), to process payments and prevent fraud, to answer
            support requests, to meet our legal obligations, and — with your consent where required — to send you information about
            the Service. We do not sell personal information.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">4. Who receives it</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>The other party to a request</strong>: when a Professional unlocks your request, they receive the contact details attached to that request, so they can quote the work.</li>
            <li><strong>Stripe</strong>, for payment processing, under Stripe's own privacy policy.</li>
            <li><strong>Our hosting provider (Supabase)</strong>: the FLEXS database is hosted in Canada (ca-central-1).</li>
            <li><strong>Authorities</strong>, only when the law requires it.</li>
          </ul>

          <h2 className="text-lg leading-snug text-fx-ink">5. Retention</h2>
          <p>
            We keep account information while your account is active. When you delete your account (Settings › Account details), your
            profile, requests and messages are deleted, except records we must keep by law (for example, payment and accounting
            records). Directory listings come from public sources and remain until corrected or removed at the business's request.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">6. Your rights</h2>
          <p>
            Under Law 25 you may ask to access your personal information, have it corrected, have it deleted, withdraw your consent,
            or receive it in a portable format. Write to support@takatak.ca; we answer within the legal delay. If you believe your
            rights were not respected, you may contact the Commission d'accès à l'information du Québec.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">7. Security</h2>
          <p>
            Access to personal information is limited to the people and systems that need it, protected by authentication, encryption
            in transit and row-level security rules in the database. No system is perfectly secure; if an incident involving your
            information occurs, we will handle it as Law 25 requires.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">8. Cookies</h2>
          <p>
            FLEXS uses only the cookies described in our Cookie Policy (/cookies): cookies strictly necessary for sign-in and
            security, and functional cookies that remember your choices. We do not use advertising or targeting cookies.
          </p>

          <h2 className="text-lg leading-snug text-fx-ink">9. Children</h2>
          <p>The Service is intended for adults and businesses. We do not knowingly collect personal information from minors.</p>

          <h2 className="text-lg leading-snug text-fx-ink">10. Changes and contact</h2>
          <p>
            We may update this policy; the current version is always on this page with its update date. Questions or requests:
            support@takatak.ca.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
