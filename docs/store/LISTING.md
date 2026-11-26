# Store listing kit

Everything the Google Play and App Store forms ask for. Texts are within the stores' length limits. Figures are real (directory count on 2026-11-26); nothing here is invented. The French was written by Claude and should be read once by a French speaker.

Screenshots are in `docs/store/screenshots/`: five screens, in English and French, at 1290 × 2796 (App Store, 6.7 inch) and 1080 × 1920 (Google Play phone). Retake them after a visible change with the script in the note at the end.

## Shared fields

| Field | Value |
| --- | --- |
| App name | FLEXS |
| Category | Business (secondary: Lifestyle) |
| Website | https://flexs.ca |
| Support URL | https://flexs.ca/support |
| Privacy policy URL | https://flexs.ca/privacy |
| Terms URL | https://flexs.ca/terms |
| Contact email | support@takatak.ca |
| Publisher | Groupe TAKATAK inc., Montréal, Québec |
| Price | Free. Professionals buy credits on the website; the app sells nothing through the stores' payment systems |
| Age rating | Everyone / 4+ (no objectionable content; user-to-user messages exist, so answer "yes" to user-generated content and name the report route: support ticket) |
| Account deletion | In the app: Settings › Account details › Delete my account. Web: https://flexs.ca/help/privacy |

## English

**Subtitle / short description (max 30 for Apple, 80 for Google)**
- Apple subtitle: `Local pros, free quotes` (23)
- Google short description: `Post a request, get quotes from local Quebec professionals. Free for customers.` (79)

**Promotional text (Apple, max 170)**
`Describe your project once and local professionals reply with their quotes. Browse more than 150,000 Quebec businesses, or join as a professional.` (146)

**Keywords (Apple, max 100)**
`quotes,contractor,plumber,electrician,cleaning,moving,quebec,montreal,handyman,renovation,services` (98)

**Full description**
```
FLEXS connects people who need a job done with local professionals across Quebec.

FOR CUSTOMERS — FREE
• Choose a service, answer a few questions and post your request in about a minute.
• Professionals in your area reply with their quotes.
• Compare the replies, message the professionals and accept the quote that suits you. There is no obligation to hire.
• Leave a verified review after the job.

FOR PROFESSIONALS
• See requests for the services you offer, in the area you serve.
• Read every request for free. Use credits only to unlock the customers you want to contact.
• Send quotes, message customers and set follow-up reminders in one workspace.
• No commission on the jobs you win.

QUEBEC BUSINESS DIRECTORY
• More than 150,000 Quebec businesses, compiled from public registers.
• Find your business, claim it for free and start with a 30-day trial.

In English and in French.

FLEXS is operated by Groupe TAKATAK inc., Montréal.
```

## Français

**Sous-titre / description courte**
- Sous-titre Apple : `Pros locaux, soumissions` (24)
- Description courte Google : `Publiez une demande et recevez des soumissions de pros du Québec. Gratuit.` (74)

**Texte promotionnel (Apple, max 170)**
`Décrivez votre projet une seule fois : des professionnels de votre région vous répondent avec leurs soumissions. Plus de 150 000 entreprises du Québec répertoriées.` (164)

**Mots-clés (Apple, max 100)**
`soumission,entrepreneur,plombier,électricien,ménage,déménagement,québec,montréal,rénovation,services` (100)

**Description complète**
```
FLEXS met en relation les personnes qui ont un travail à faire et les professionnels de leur région, partout au Québec.

POUR LES CLIENTS — GRATUIT
• Choisissez un service, répondez à quelques questions et publiez votre demande en une minute environ.
• Les professionnels de votre secteur vous répondent avec leurs soumissions.
• Comparez les réponses, écrivez aux professionnels et acceptez la soumission qui vous convient. Rien ne vous oblige à embaucher.
• Laissez un avis vérifié après les travaux.

POUR LES PROFESSIONNELS
• Voyez les demandes pour les services que vous offrez, dans le secteur que vous desservez.
• Lisez chaque demande gratuitement. Utilisez des crédits seulement pour débloquer les clients que vous voulez joindre.
• Envoyez des soumissions, écrivez aux clients et planifiez vos suivis dans un seul espace de travail.
• Aucune commission sur les contrats que vous obtenez.

RÉPERTOIRE D'ENTREPRISES DU QUÉBEC
• Plus de 150 000 entreprises du Québec, tirées de registres publics.
• Trouvez votre entreprise, réclamez-la gratuitement et commencez par un essai de 30 jours.

En français et en anglais.

FLEXS est exploité par Groupe TAKATAK inc., Montréal.
```

## Data safety (Google) and App privacy (Apple)

Answer from what the app actually does (see `/privacy`):

| Data | Collected | Why | Shared with third parties |
| --- | --- | --- | --- |
| Name, email address | Yes | Account, requests, quotes | The professional who unlocks a request sees the customer's name and contact details |
| Phone number | Optional | So a professional can call about a request | Same as above |
| Messages, request details, uploaded files | Yes | The service itself | Only the two parties of a request |
| Approximate location (town or postal code typed by the user) | Yes | Matching requests and professionals | Shown to professionals as the request's town |
| Purchase history | Yes (credits) | Billing | Payment processor (Stripe) |
| Crash and error data | Yes, without personal data | Fixing faults | No |
| Device location (GPS), contacts, photos library, advertising ID | No | | |

Data is encrypted in transit. Users can delete their account and data in the app. No advertising or analytics trackers.

## Retaking the screenshots

Build the site, serve it (`npx vite preview --port 4174`), then load each of `/`, `/services/plumbing`, the first wizard step, `/directory?city=Montréal&trade=Plumbing` and `/pro` at a 430 × 932 viewport with device scale 3 (App Store) and 360 × 640 with device scale 3 (Google Play), once with `localStorage['flexs.lang']='en'` and once with `'fr'`.
