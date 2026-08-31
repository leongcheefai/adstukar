# AdsTukar — domain glossary

Use these terms as written. The code, the dashboard, and the docs share them.

| Term | Meaning |
|---|---|
| **Member** | A signed-up user. Owns products and a point balance. |
| **Product** | A member's web app: name, URL, domain, tagline (≤ 60 chars), logo. Has a status. |
| **Status** | `pending` (in the moderation queue), `approved` (may serve), `rejected` (reason stored). |
| **Verified domain** | The product's domain proved by a token at `/.well-known/adstukar.txt` or a DNS TXT record. Required for approval and for hosting. |
| **Placement** | One spot on a product's site. Identified by an API key (`pk_…`). Has a size, a house-ad share, and excluded terms. |
| **Host** | The product (and its member) whose placement shows a card. Earns. |
| **Advertiser** | The product (and its member) whose card is shown. Spends. |
| **Card** | The fixed sponsored template: logo, name, tagline, "Sponsored" label, link. Sizes `small` 320×64 and `medium` 300×120. |
| **House ad** | The host's own product shown in its own placement. Zero cost, zero earn. Served when nothing is eligible or when the house-ad roll wins. |
| **Impression** | One serve of a card into a placement. `viewable` once the beacon confirms ≥ 50 % visible for ≥ 1 s. |
| **Verified impression** | A viewable impression that passed the caps. Only these move points. |
| **Beacon** | The embed's one-time viewability report for an impression. |
| **Session hash** | `sha256(daySalt + ip + userAgent)`; the salt lives in memory and rotates daily. Used only for the per-session cap. |
| **Point** | The only currency. Earn +1 per verified impression shown; spend −2 per verified impression received. |
| **Ledger entry** | One immutable point movement: `delta`, `reason` (`earn`, `spend`, `grant`, `expiry`, `void`), `state` (`pending`, `settled`, `void`), idempotency key. |
| **Balance** | `SUM(delta)` of settled entries. Pending is summed separately and shown dimmed. |
| **Settlement** | Pending earn entries become settled 24 h after the impression. |
| **Expiry** | Settled earn entries lose their value 12 months after settlement via a compensating `expiry` entry. |
| **Grant** | Points given by the system: 50 on approval, 150 once a member's placements reach 100 verified impressions. |
| **Excluded term** | A phrase (≤ 20 per placement) that blocks any card whose name or tagline contains it. |
| **Moderation queue** | Pending products, oldest first, reviewed by an admin. |
