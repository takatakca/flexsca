# FLEXS

Independent lead marketplace at **flexs.ca**, part of the TakaTak ecosystem. Customers post service requests and compare professional quotes. Professionals discover opportunities, unlock contacts with credits, manage conversations and follow-ups, and maintain business profiles.

Built with React, TypeScript, Vite, Tailwind/shadcn, Supabase Auth/PostgreSQL/Realtime, and Stripe. TakaTak V1 receives verified, opaque attribution events through a server-side integration; live connection requires deployment and credentials.

## Development

Node 24 and npm are validated. Use the existing checkout in an isolated Codex cloud task; create a Git worktree only when explicitly requested.

```sh
npm ci --no-audit --no-fund
npm run dev
```

The Vite server uses port 8080. The frontend reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Only public configuration belongs in Vite variables. Stripe, service-role, scheduler, and TakaTak service secrets belong on the server.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
```

Database tests apply all migrations to a local PGlite PostgreSQL instance and exercise roles, privacy, credit operations, quotes, notifications, refunds, and administration. Browser tests use explicit API fixtures; they do not create production leads, send emails, or charge cards. Install Chromium with `npx playwright-core install chromium` if no system browser exists, or set `CHROMIUM_PATH`.

GitHub Actions runs these checks and Deno Edge Function checks. Remaining fast-refresh export warnings do not fail lint.

## Application areas

- `/post-job`: customer request questionnaire and intake.
- `/my-requests`: verified customer requests, quotes, and conversations.
- `/app/dashboard`: professional overview.
- `/app/leads`, `/app/responses`, `/app/reminders`, `/app/notifications`: professional work management.
- `/app/settings/profile`: business profile, services, media, and Q&A.
- `/app/admin`: operations restricted by server-managed administrator membership.
- `/merchant`: business listing management and access to marketplace work.

## Deployment

**The new frontend requires the new backend migrations and Edge Functions. Apply and verify the backend before promoting this release to the live frontend.** See [release instructions](docs/FLEXS_RELEASE.md) for exact configuration, promotion order, validation, rollback, and remaining feature gaps.

`python scripts/release-preflight.py` checks Supabase management access and migration history without changing the remote schema. Supply its management token securely through environment settings.

This repository was created with [Lovable](https://lovable.dev/projects/b24b4595-d350-4adf-be45-0c31ec9766d3). Changes pushed to `main` can sync to Lovable. Release branches allow backend deployment and review before frontend promotion.
