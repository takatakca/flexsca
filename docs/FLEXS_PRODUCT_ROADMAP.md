# FLEXS product delivery scope

FLEXS operates independently at flexs.ca, with its own marketplace data and account permissions. TakaTak V1 is an integration partner. The existing release does not establish a shared identity system, shared customer database, or full Bark parity.

## Current implementation and verification

| Area | Implemented in this branch | Production verification |
| --- | --- | --- |
| Brand and navigation | New homepage, professional landing, workspace, mobile navigation, favicon/social card | Hosting rollout and deployed responsive review pending |
| Request intake | Category questions, contact validation, service/location handoff, confirmed-email ownership | Real Auth emails and abuse controls need staging validation |
| Marketplace | Paginated safe search, private contact previews, credit unlock, independent archives | Concurrent unlocks and realistic query-plan measurements pending |
| Customer decisions | Private replies, CAD quotes, single accepted quote, request closure | Real multi-account staging checks pending |
| Reputation | Verified customer relationship reviews, protected verified feedback, public privacy | Verification does not certify completed work or professional licensing |
| Credits | Wallet, ledger, Stripe checkout, signature validation, exactly-once fulfillment/refunds | Test-mode end-to-end Stripe check and webhook configuration pending |
| Workflow | Reminders, due notices, preferences, unread updates, quote estimates | Due reminders currently collect while the app is open; external delivery not built |
| Support and operations | Private tickets, authorized staff replies, audited moderation/refunds | Administrator bootstrap and real support ownership pending |
| TakaTak attribution | Opaque click attribution, durable leased outbox, bounded worker retries | Live credentials, scheduler, endpoint acceptance/deduplication pending |

Automated database checks apply every migration and exercise actual roles/RLS. Browser scenarios use intercepted API fixtures. Neither establishes a deployed system by itself. Consult FLEXS_RELEASE.md for the promotion order and current validation counts.

## Integration contract and documents

The TakaTak V1 reference examined at commit `8adfa23ca50f52f6a49e0eaec68e933c68dd1c78` documents:

- Public service destination: `https://takatak.ca/services/lead-generation`.
- Attribution ingestion: `POST https://takatak.ca/api/integrations/ads/flexs/events`, authenticated with a server-only service token.
- An opaque `ttclid` identifies the source click; a stable external event ID allows retry deduplication.
- No customer name, email, phone, message, or document is sent through that attribution contract.

The generic FLEXS CRM adapter is a placeholder in the reference. Shared login and customer synchronization require a defined and verified contract before implementation. Other ChatGPT project conversations are not available in this workspace; they are not evidence of an API contract.

Private customer documents/attachments are a separate remaining feature. They require private storage, per-request authorization, file size/type limits, malware handling, deletion/retention rules, and signed download URLs. Public portfolio media must remain separate from private customer documents. Do not place attachments in attribution payloads or expose private files through public storage.

## Next implementation priorities

1. Complete responsive and accessibility review of remaining screens: customer workspace, onboarding, public profiles, quotes, settings, service pages, and legal/informational routes. Replace remaining inert actions and unsupported marketing claims.
2. Strengthen intake quality: CAPTCHA verification on the server, phone verification, duplicate/spam detection, bounded submission limits, and moderation tools. Validate costs and provider/customer expectations with real requests.
3. Build professional service-area preferences and matching. Document remote-work behavior and location privacy before adding geospatial ranking.
4. Add private request attachments and the document lifecycle described above.
5. Add external notifications using explicit consent, signed provider callbacks, delivery tracking, retries, and user preferences. Keep in-app reminders available.
6. Implement professional verification operations, customer dispute handling, and account/data lifecycle workflows with recorded decisions.
7. Add subscriptions only with defined entitlements, cancellation behavior, signed billing events, and migration coverage.
8. Add privacy-conscious conversion measurement, operational alerts, query/worker monitoring, and load tests using representative data.

## Live release prerequisites

Supabase management access, deployed function secrets, Stripe webhook configuration, TakaTak service credentials, an administrator account, Auth redirects/email delivery, hosting access, and DNS/HTTPS verification must be checked before production promotion. Existing remote secrets must be inspected and reused through authorized management tools rather than overwritten blindly.

Code pushes preserve the independent release branch until backend deployment is verified. Never treat a browser checkout redirect as payment confirmation, a supplied phone as verification, quote estimates as revenue, or an accepted quote as proof that work was completed.
