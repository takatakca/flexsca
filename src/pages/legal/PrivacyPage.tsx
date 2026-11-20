import LegalPage, { type LegalSection } from "@/components/fx/LegalPage";

const SECTIONS: LegalSection[] = [
  { title: "Who we are", body: [
    "FLEXS (flexs.ca and the FLEXS apps) is an online marketplace operated by GROUPE TAKATAK, Montréal, Quebec, Canada. It lets people post a service request and lets professionals reply with quotes.",
    "The person responsible for the protection of personal information at GROUPE TAKATAK can be reached by opening a support ticket in FLEXS (Help centre, then Contact us). We answer privacy requests within 30 days.",
  ] },
  { title: "Information we collect", body: [
    "We collect only what the service needs:",
    [
      "Account: your email address and the name you give. A password is stored only as a one-way hash by our sign-in provider.",
      "Requests you post: the service, your answers to the questions, the town or postal code, your name, email and, if you give it, your phone number, the details you write and any files you attach.",
      "Professional profiles: business name, description, town, service area, photos and the links you add.",
      "Messages, quotes, reviews and support tickets you send through FLEXS.",
      "Credits: purchases and how credits are spent. Card details are entered on Stripe's pages and never reach FLEXS.",
      "Technical data: a sign-in token kept in your browser or app, and standard server logs (date, address of the device, page requested).",
    ],
    "We do not buy personal information about you from data brokers.",
  ] },
  { title: "The business directory", body: [
    "FLEXS lists Quebec businesses using open public data: the Régie du bâtiment du Québec, the Office de la protection du consommateur, the Ministère du Tourisme, the Ville de Montréal and OpenStreetMap. A listing shows a business name, its town, its kind of activity and, for building contractors, its public licence number.",
    "We do not store or show a phone number, an email address or a street address for an unclaimed listing. Where a public source includes a business email, we keep only a one-way fingerprint of it, used to confirm an owner who claims the listing.",
    "If a listing concerns you and you want it corrected or removed, open a support ticket. Removal is free and the listing stays removed on later updates.",
  ] },
  { title: "How we use information", body: [
    [
      "To run the service: show your request to professionals in the right trade and area, deliver messages and quotes, and keep your account secure.",
      "Your contact details on a request are shown only to a professional who unlocks that request, and to you.",
      "To prevent fraud and abuse, for example limits on repeated purchases or duplicate requests.",
      "To answer support requests and meet legal obligations such as accounting records.",
    ],
    "We do not sell personal information. We do not send marketing emails unless you ask for them.",
  ] },
  { title: "Who processes information for us", body: [
    [
      "Supabase hosts the database, sign-in and file storage. The FLEXS database is hosted in Canada (Montréal region).",
      "Stripe processes card payments for credits.",
      "Anthropic provides the optional assistant that helps a professional draft a quote. When a professional uses it, the text of the request and of the draft is sent to produce the suggestion. It is off unless enabled by FLEXS.",
      "TakaTak, a sister service of GROUPE TAKATAK: when you arrive from a TakaTak link, FLEXS reports that a request was made using an anonymous reference. No name, email, phone number or message is included.",
    ],
    "Some of these providers may process data outside Quebec. We choose providers that protect information to a standard comparable to Quebec law.",
  ] },
  { title: "How long we keep it", body: [
    "We keep your information while your account is open. When you delete your account, your profile, requests, messages, quotes, uploaded files and unused credits are deleted. Payment records required by tax and accounting law are kept for the legal period, without your request content.",
  ] },
  { title: "Your rights", body: [
    "Under Quebec's Act respecting the protection of personal information in the private sector and Canada's PIPEDA you can:",
    [
      "see the personal information we hold about you and get a copy;",
      "have it corrected;",
      "withdraw your consent and delete your account (Settings, Account details, Delete my account);",
      "ask who your information was shared with;",
      "complain to the Commission d'accès à l'information du Québec or the Office of the Privacy Commissioner of Canada.",
    ],
    "To use these rights, open a support ticket from the account concerned.",
  ] },
  { title: "Cookies and similar storage", body: [
    "FLEXS keeps a sign-in token and a few preferences in your browser or app. It does not use advertising cookies. See the Cookies page for details.",
  ] },
  { title: "Children", body: ["FLEXS is for adults. You must be 18 or older to create an account or post a request."] },
  { title: "Security", body: [
    "Access to data is limited by per-account rules in the database, connections are encrypted, and request attachments are private to the customer and the professionals who unlocked the request. No system is perfectly secure; if we learn of an incident that presents a risk of serious harm, we will notify the people concerned and the regulator.",
  ] },
  { title: "Changes", body: ["We will post any change to this policy on this page and change the date above. If a change is significant, we will tell account holders by email or in the app."] },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated="20 November 2026" intro="This policy explains what FLEXS collects, why, who handles it and what you can do about it." sections={SECTIONS} />;
}
