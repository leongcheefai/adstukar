# AdsTukar — Cross-Promotion Ad Exchange for Indie Hackers

**Tagline**: Show two ads, earn one for yourself.

**Target User**: Indie hackers and micro-SaaS founders (SEA-first, then global) who ship web apps and have zero marketing budget. They trade ad space in their own product for exposure in other members' products. No money moves in v1.

## How the system works (context for the builder)

Members join, register a product, and paste one embed snippet into their site. The embed shows a small "Sponsored" card for another member's product. Each verified impression shown earns the host +1 point. Each impression of the member's own card in someone else's placement costs −2 points. Points are the only currency. A moderation step approves every product before it can serve.

## MVP Features

- **Publisher dashboard**: Sign up (email + password), register a product (name, URL, tagline, logo), see point balance, and view daily stats (impressions shown, impressions received, clicks, CTR).
- **Domain verification**: Prove product ownership with a token at `https://<domain>/.well-known/adstukar.txt` or a DNS TXT record. A "Verify" button checks it server-side.
- **Embed + ad server**: A vanilla JS snippet (one `<script>` tag rendering into a target `<div>`) plus a React component wrapper. It requests one ad from `GET /api/serve?key=...`, renders the fixed card template (logo, name, tagline, "Sponsored" label, link), and reports viewability.
- **Point ledger**: Double-entry ledger table for all point movements: earn (+1), spend (−2), grants, expiry, voids. Balances are always derived from the ledger, never stored as a mutable counter. Includes the pending → settled state (24 h) for earned points.
- **Impression verification**: IntersectionObserver check in the embed (≥50% visible for ≥1 s) before firing the earn beacon. Server enforces: one count per placement per page load, max 10 per visitor session, per-domain daily earn caps (1,000 for new domains).
- **Moderation queue**: Admin-only page listing submitted products with approve / reject actions. Every product must be approved before serving. (AI pre-scoring is a later phase; build the human queue first.)

## Ad selection logic (v1, no AI yet)

1. Filter to approved products with balance ≥ 2, excluding the host's own products and the host's excluded terms (up to 20 phrases matched against name + tagline).
2. Rank by least-recently-served to this placement (simple rotation).
3. Serve the winner; write −2 to its ledger and +1 (pending) to the host's ledger only after the viewability beacon arrives.
4. If no eligible product exists, serve the host's own house ad (0 cost, 0 earn).

## UI/UX Guidelines

**Design Style**: Minimal, trustworthy, developer-oriented. Neutral background, one accent color (teal), monospace for numbers and API keys. The ad card itself must be understated: small, clean, clearly labeled "Sponsored", never louder than the host site.

**Navigation Pattern**: Left sidebar in the dashboard — Overview, Products, Placements, Ledger, Settings. Public site is a single landing page.

**Key Screens**:
- **Landing page**: Explains "show 2, earn 1" with a 3-step diagram and a live example card. One CTA: "Join free".
- **Overview**: Point balance (settled + pending shown separately), today's impressions shown/received, clicks, CTR, 30-day line chart.
- **Products**: List of the member's products with status (pending review / approved / rejected), edit creative (tagline ≤ 60 chars, logo upload), toggle "advertise this product" and "show ads" separately.
- **Placement setup**: Copy-paste embed snippet with API key, size picker (small banner 320×64, medium card 300×120), excluded-terms editor, house-ad percentage slider.
- **Ledger**: Filterable table of every point movement with reason codes.
- **Admin moderation**: Queue of pending products; each row shows the landing page screenshot link, name, tagline; approve/reject with a reason.

**Interactions**: Copy buttons on snippets and keys with confirmation toast. Pending points render dimmed with a tooltip explaining the 24 h settlement. Card preview updates live while editing creative.

## Tech Stack

- **Frontend**: Vite + TypeScript + React; Tailwind CSS; Recharts for the stats chart.
- **Backend**: Hono + TypeScript on Node/Bun.
- **Database**: Postgres with Drizzle ORM.
- **Embed**: Separate small vanilla TS bundle (no React), built with Vite library mode, target < 10 kB gzipped.
- **Auth**: Email + password with session cookies (argon2 hashing). No OAuth in v1.
- **Architecture**: Monorepo with three packages — `web` (dashboard + landing), `api` (Hono), `embed` (snippet). Feature-based folder structure. Zod schemas shared between api and web for request/response types.
- **Hosting target**: Railway (api + Postgres), static hosting for web and the embed bundle behind a CDN path.

## Data model (core tables)

- `users` (id, email, password_hash, role, created_at)
- `products` (id, user_id, name, url, domain, tagline, logo_url, status, verified_at)
- `placements` (id, product_id, api_key, size, house_ad_pct)
- `excluded_terms` (placement_id, phrase)
- `ledger_entries` (id, user_id, delta, state [pending|settled|void], reason [earn|spend|grant|expiry|void], impression_id, created_at, settles_at)
- `impressions` (id, placement_id, served_product_id, session_hash, viewable, clicked, created_at)

## Constraints

- **No user tracking**: no cookies in the embed, no fingerprinting, no third-party requests from the embed except the serve/beacon endpoints. Session cap uses an ephemeral in-memory session hash, not a stored identifier.
- **Ledger integrity**: all point mutations go through one transactional service function. Never update a balance column directly. Every serve and beacon is idempotent (impression id as the key).
- **Economy rules are configuration, not hardcoded literals**: earn amount, spend amount, grant sizes, caps, settlement delay, and expiry live in one config module.
- **Rate limiting** on serve and beacon endpoints per API key and per IP.
- **Grant logic**: 50 points on product approval, 150 more after the member's placements serve 100 verified impressions.
- **Point expiry**: settled earn entries expire 12 months after settlement via a daily job.
- **Deferred, do not build now**: paid boost credits, AI matching, AI moderation scoring, localization, mobile SDKs, sponsor marketplace. Leave clean extension points (the ranking step and the moderation queue) for them.
- Minimize dependencies; no analytics SaaS in v1.
