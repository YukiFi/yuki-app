# Yuki App — Operations Notes

This file captures non-obvious operational context for the project. Code conventions are derivable from the source; the things below are *not*.

## Stack

- **Next.js 16** (App Router) on **pnpm 10.x** + Node 22 (Vercel) / Node 25 (local)
- **Alchemy Smart Wallets** (`@account-kit/react`) — wallet address is the user identity
- **Neon Postgres** via the `pg` library — pool created in `lib/db-postgres.ts`
- **Vercel** for hosting, with the **Vercel-Native Neon Integration** managing DB env vars
- **GitHub** at `YukiFi/yuki-app`, `main` branch

## Build constraints (these will bite you if you forget)

- `package.json` uses `next build --webpack`. **Do not** drop the flag — Next 16 defaults to Turbopack, which errors on the `webpack: (config) => …` block in `next.config.ts:5` (the `pino-pretty` alias is required at runtime, can't just be removed).
- `vercel.json` pins `installCommand: "pnpm install --frozen-lockfile"` and `buildCommand: "pnpm build"`. The Vercel project's dashboard settings still say `bun install`; the `vercel.json` overrides them. Don't delete it.
- `lib/validation/profile.ts` imports `zod` — `zod` *is* in dependencies as of PR #1. Local `next dev` skipped strict typecheck and hid this for a while; production builds run `tsc` and will fail if it's removed.

## Database (Neon)

- The old project `deceit` (id `snowy-glitter-19227604`) under your personal Neon org is **archived** — ignore it.
- A `dev` branch exists on `yuki-db` (endpoint `ep-billowing-sky-aqs045ho`). Schema is copy-on-write from `main`. Use it for local seeding so you don't pollute production data.
- **Schema migrations** run on cold start in `lib/db-postgres.ts:initializeDatabase()`. This is "good enough" for now but is a known footgun on preview deploys (race conditions between concurrent first requests). Migrate to `drizzle-kit` or `node-pg-migrate` before the team grows.
- Tables: `users`, `wallets`, `deposits`, `withdrawals`, `contacts`, `handle_history`. Profile columns (display_name, bio, avatar_url, banner_url, is_private) live on `users`.

### Pointing local at the dev branch

After `vercel env pull` (which writes the **production main** connection string into `.env.local`), local dev is pointing at production. To use the `dev` branch instead, swap the endpoint in every Postgres URL/host:

```
ep-divine-dream-aqvha48i  →  ep-billowing-sky-aqs045ho
```

Get fresh credentials any time with:

```fish
neonctl connection-string dev --project-id polished-sun-69129803 --org-id org-silent-credit-64942940 --pooled
neonctl connection-string dev --project-id polished-sun-69129803 --org-id org-silent-credit-64942940
```

## Env vars and the `.env.local` trap

- `.env.local` is **created/overwritten** by `vercel env pull`. Do not hand-edit and assume it survives.
- `.env*` is gitignored (`.gitignore:34`) — credentials are safe from git, but `vercel env pull` *will* clobber any local edits.
- The Neon Vercel-Native Integration manages `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `PGHOST`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`, `POSTGRES_*`, and `NEON_PROJECT_ID`. Don't manually set these in the Vercel dashboard — let the integration own them.
- App-level secrets (`SESSION_SECRET`, `ALCHEMY_API_KEY`, `COINBASE_*`, `MOONPAY_API_KEY`, `RAMP_API_KEY`, `TRANSAK_API_KEY`) are scoped to **Development, Preview, Production** and have lived in Vercel since the project started.
- `NEXT_PUBLIC_DEMO_MODE=1` is the local-only flag for fixture mode (see below). Do **not** set it on Vercel.

To pull from a non-default environment without overwriting your local file:

```fish
vercel env pull .vercel/.env.preview --environment=preview
vercel env pull .vercel/.env.production --environment=production
```

## Auth flow

- Users authenticate via Alchemy Smart Wallets (email OTP or passkey). The wallet address is their primary identifier in our DB.
- `useAuth` (`lib/hooks/useAuth.ts`) calls `POST /api/auth/me` with the wallet address **and** the Alchemy session email. The route conditionally upserts the email (only writes when present, valid, and different from DB) via `setUserEmailIfChanged`.
- Display name defaults to username on first set — handled in `app/api/auth/username/route.ts:176-184`. New users hit `/setup` after first login, choose a username, and `display_name` is seeded to match.
- The email shown in `/settings` prefers the DB row, falling back to the live Alchemy session if the DB hasn't synced yet (covers the first round-trip).

## Demo data

Two independent layers, used together:

**1. DB seed (real rows, scoped to demo IDs).**
```fish
pnpm db:seed 0xYourSmartWalletAddress   # idempotent; tags rows id LIKE 'demo_%'
pnpm db:reset                            # wipes only demo_% rows
```
This populates `users` (you + 3 friends), `contacts`, `deposits`, `withdrawals`. It does **not** make balances or activity feed populate — those read on-chain.

**2. Client-side fixture mode for on-chain reads.**
```fish
NEXT_PUBLIC_DEMO_MODE=1 pnpm dev
```
`lib/demo-fixtures.ts` ships canned balances + transactions. `useBalance` and `useTransactionHistory` short-circuit to fixtures when the flag is set.

## Common commands

```fish
pnpm dev                                 # next dev --webpack
pnpm build                               # next build --webpack (must keep flag)
pnpm db:seed 0x...                       # populate demo rows
pnpm db:reset                            # remove demo_% rows
pnpm exec tsc --noEmit                   # type check (CI runs this)

vercel env pull                          # ⚠ overwrites .env.local with Development env
vercel env ls                            # list keys + scopes
vercel inspect dpl_… --logs              # debug a failed deploy
vercel ls yuki-app                       # recent deployments

gh pr create | gh pr checks <n> | gh pr merge <n> --squash --delete-branch

neonctl branches list --project-id polished-sun-69129803 --org-id org-silent-credit-64942940
neonctl branches create --name <n> --project-id … --org-id …
neonctl connection-string <branch> --project-id … --org-id … [--pooled]
```

## Known issues / TODO

- **Vercel project settings still claim `bun install`/`bun run build`.** `vercel.json` overrides this, but the dashboard is misleading. Update via Project → Settings → General when convenient.
- **Schema migrations on cold start** — see Database section. Move to a real migration tool before scaling.
- **Neon password rotation** — an early `neondb_owner` password was pasted into chat history on 2026-05-07 and should be considered leaked. The Vercel integration later auto-rotated to a new password during the sync; verify the leaked one is actually invalidated via the Neon dashboard (Project → Roles → reset).
- **Onboarding page `app/onboarding/page.tsx`** is a fake simulation (hardcoded card numbers, fake processing animation). Real onboarding is `app/setup/page.tsx`. The `/onboarding` route should probably be deleted or rewritten.

## Integration accounts

- **GitHub:** `haruxe` (logged in via `gh auth`)
- **Vercel:** team `haruxes-projects`, project `yuki-app` (`prj_0KRSN7OZRpMaenaKW2dUNvHrV6na`)
- **Neon:** owner `haruxe@proton.me`, three orgs (personal + two Vercel-managed); the canonical project lives in **"Vercel: Haruxe"**
