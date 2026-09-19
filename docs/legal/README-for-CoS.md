# CapyChannel legal drafts — notes for Chief of Staff / counsel

**Status:** DRAFT FOR REVIEW — NOT LEGAL ADVICE  
**Date prepared:** 13 September 2026 · **Last updated:** 16 September 2026  
**For:** Human review tracked as **Linear KEV-6** (do **not** auto-publish; do **not** message Linear from the drafting agent)  
**Operator:** Praxor Studio — registration **SA0656426-A** (Malaysia ROB-style number as given; **not** framed as a US Delaware corporation)  
**Product public name:** **CapyChannel** — confirmed 16 September 2026

---

## Changes applied (16 Sep 2026)

Applied after decisions from Wai Hong on 16 Sep 2026.

| Topic | Change applied in drafts |
|-------|--------------------------|
| **Product name** | **Confirmed: CapyChannel.** All 16 `[PRODUCT NAME]` placeholders in the three policy files are replaced. The banner caveat “(name not yet confirmed)” is removed from each file. **File and folder names still read `capytv`** — rename them when you are ready. |
| **Primary domain** | **Confirmed: `capychannel.site`.** Every `[PRODUCT DOMAIN]` placeholder in the three policy files is replaced. The product site now reads **https://capychannel.site** in each Contact section. The placeholder stays open **only** for the product name and the contact email. |
| **Contact email** | **Confirmed: `support@capychannel.site`.** All 13 `[CONTACT EMAIL]` placeholders in the three policy files are replaced. One address serves support, legal, privacy, ads review, appeals, and disputes for now. Split it into `legal@` or `privacy@` later if the volume requires it. |
| **Controlling language** | **Confirmed: English controls.** The clause reads: *“This document is published in English. Where any translation of it exists, the English version is the authoritative one and governs in the event of a conflict.”* Terms **§18** replaces its `[TBD: English / Bahasa Malaysia]` bullet. Privacy adds a new **§17 Language** (Contact moves to §18). Ads adds a new **§12 Language** (Contact moves to §13). |
| **Counsel note added** | Privacy **§17** carries a new `[TBD: counsel to confirm this against PDPA Section 7, which requires the privacy notice in Bahasa Malaysia and English.]` See Review finding 9. An English-controls clause does **not** remove that bilingual duty. |
| **Last updated** | The three policy files now read **16 September 2026**. |

---

## Changes applied (15 Sep 2026)

Applied after a review of the drafts against the product code (the `adstukar` repository) and decisions from Wai Hong on 15 Sep 2026.

| Topic | Change applied in drafts |
|-------|--------------------------|
| **Product name** | ~~Not confirmed~~ — **superseded 16 Sep: CapyChannel.** Every product-name mention read **`[PRODUCT NAME]`**. The domain and the contact email carried the old name, so they read **`[PRODUCT DOMAIN]`** and **`[CONTACT EMAIL]`** — both are **resolved on 16 Sep** to `capychannel.site` and `support@capychannel.site`. The inline “temporary / placeholder” and “not yet formally confirmed” notes are removed, because the placeholders already say it. File and folder names keep `capytv` until the name is confirmed. For reference: the code brands the network **CapyAds** (`capyads.com`) and calls the screen app **CapyTV** (`packages/config/src/project.ts`, `CONTEXT.md`). |
| **Wallet and payment system** | Not complete. Every passage on points or credit, pricing, rates, revenue share, earnings, measurement for billing and earnings, purchases, refunds, balances, expiry, and payouts now reads **`[to fill in later]`**. The defined term “Media Credit” is removed, and so is the “Valid Impression” definition. See **Wallet and payment system — to fill in later** below. |
| **Payment system** | Not set up. Payment providers, payout providers, payout verification, and **which countries can receive payouts** are **`[to fill in later]`**. |
| **Ad categories** | Ads Policy §4 adds seven categories: tobacco, vapes, and smoking products; alcohol; medicines and health products; moneylending and unlicensed credit; pyramid and unlicensed direct-selling schemes; false halal claims; race, religion, and royalty. It also adds a **venue-fit** rule, because people of all ages can see the screens. Each new row carries a counsel note that names the Malaysian law to check. The typo “RMX/day” is fixed. |
| **GDPR (EEA / UK)** | New Privacy Policy **§13**: controller details, EU / UK representative and DPO placeholders, a legal-basis table, GDPR rights, automated decisions, transfer safeguards, and the one-month response time. |
| **California (CCPA)** | New Privacy Policy **§14**: an applicability note for counsel, the categories of personal information, no sale and no sharing, Global Privacy Control, CCPA rights, authorized agents, the 10-business-day and 45-day response times, and Shine the Light. |
| **Data requests** | New Privacy Policy **§15**: one request process for PDPA, GDPR, and CCPA requests (how to send, verification, response, partial refusals, fees). |
| **Privacy data list** | So that §13–§15 describe real data, Privacy §2 now matches the code: the screen pairing code and access key, the network prefix (treated as personal data), the last report time, screen location, screen photo, open hours and time zone, the distributor’s own promotion and filters, the weather and news-feed settings kept on the screen, a profile photo, Google sign-in, dashboard feedback, and a new **§2.8** for people who scan a code. The §2.3 statement that no photos are collected is corrected. |
| **Section numbers** | Privacy Policy: old §13 Changes is now **§16**; old §14 Contact is now **§17**. Terms: §5 is now “Measurement and reporting” and §7 is now “Advertisers — campaigns, payments, and billing” (§7.1 Campaigns, §7.2 Payments, billing, and refunds). Ads Policy: §10 is now “Measurement”. |
| **Dates** | “Last updated” is **15 September 2026** in all three drafts. |

---

## Clarifications applied (Wai Hong via CoS, 13 Sep 2026)

Rows marked **superseded** were replaced by the 15 Sep changes above.

| Topic | Decision applied in drafts |
|-------|----------------------------|
| **Public / legal product name** | ~~**CapyTV** only~~ · ~~name not confirmed; `[PRODUCT NAME]` (15 Sep)~~ — **superseded 16 Sep:** **CapyChannel** (confirmed). |
| **Contact email** | ~~`info@capytv.app` (temporary)~~ · ~~`[CONTACT EMAIL]` (15 Sep)~~ — **superseded 16 Sep:** **`support@capychannel.site`** (confirmed). |
| **Mailing address** | Left as **[TBD: mailing address]**. |
| **v1 surfaces** | **Website / browser only.** Native app, Mac menu-bar, and dedicated native display-client language rewritten to **web/browser / browser session / web player**. No promise of native Mac/display clients in v1. |
| **Governing law / venue** | Laws of **Malaysia**; disputes in **Malaysian courts**. Optional mediation/arbitration kept as an **optional counsel note** only (not default). |
| **Payments / payouts** | ~~Mechanics remain [TBD] placeholders~~ — **superseded 15 Sep:** wallet and payment system not complete and payment system not set up; `[to fill in later]`. |
| **Primary domain** | ~~**capytv.app** as a working assumption~~ · ~~`[PRODUCT DOMAIN]` (15 Sep)~~ — **superseded 16 Sep:** **`capychannel.site`** (confirmed). |

---

## Files in this folder

| File | Purpose |
|------|---------|
| `capytv-terms-of-service.md` | Platform Terms (Advertisers + Distributor Ops) |
| `capytv-privacy-policy.md` | Privacy Policy (collection / use / rights; PDPA, GDPR, and CCPA sections; data requests) |
| `capytv-ads-policy.md` | Creative & campaign rules, including prohibited categories |
| `README-for-CoS.md` | This handoff note |

**File names:** the four files still start with `capytv`. The name is now **CapyChannel**. Rename them when you decide; nothing inside the files depends on the file names.

Each policy file starts with a **DRAFT FOR REVIEW — NOT LEGAL ADVICE** banner, last-updated **16 Sep 2026**, and Praxor Studio / SA0656426-A / **CapyChannel** identification.

**Location:** this folder (`capytv-drafts`). Earlier notes named `/home/box/capytv-drafts/` and `/workspace/capytv-drafts/`; those paths belonged to the drafting agent’s environment. Nothing is published to Linear or GitHub.

---

## Placeholder key

| Placeholder | Meaning |
|-------------|---------|
| ~~`[PRODUCT NAME]`~~ | **Resolved 16 Sep: CapyChannel.** No longer in the files. |
| ~~`[PRODUCT DOMAIN]`~~ | **Resolved 16 Sep: `capychannel.site`.** No longer in the files. |
| ~~`[CONTACT EMAIL]`~~ | **Resolved 16 Sep: `support@capychannel.site`.** No longer in the files. |
| `[to fill in later]` | Point-system or payment-system content — product fills it when those systems are final |
| `[TBD: …]` | Open item for counsel or product |

Before publication, search all files for `[` to find every open placeholder.

---

## Wallet and payment system — to fill in later

The wallet and payment system is not complete, and the payment system is not set up. These sections are blank on purpose:

| File | Section | What it must cover when filled |
|------|---------|--------------------------------|
| Terms | §3 Accounts (payout verification) | Identity and payout-account checks before a payout |
| Terms | §5 Measurement and reporting | What counts toward billing and earnings; measurement and anti-fraud rules; reporting and finalization windows |
| Terms | §6 Distributor Ops — earnings | Rates and revenue share, pending and hold periods, minimum payout, payout methods and providers, **payout countries**, taxes (including Malaysian withholding / e-invoice), adjustments and reversals |
| Terms | §7.2 Payments, billing, and refunds | Name of the unit, purchase methods, currency, pricing, refunds, chargebacks, expiry |
| Terms | §10 Third-party services | Payment and payout providers |
| Terms | §14 Termination | What happens to outstanding balances when an account closes |
| Privacy | §2.1, §2.5, §3, §6 | Payment and payout data, tax identifiers, providers, PCI posture |
| Privacy | §13.1 | Legal basis for payments and payouts |
| Privacy | §14.1 | Customer records and commercial information from payments; payment sources |
| Ads Policy | §2, §6, §7, §8 | Campaign funding; billing adjustments; unspent balances and refunds; effect of violations on earnings |
| Ads Policy | §10 Measurement | What counts toward billing and earnings |

**Notes from the 15 Sep review, for when this is filled.** They describe the code as it stands; the numbers may change.

- The code keeps its economy settings in `packages/config/src/economy.ts`. The public FAQ (`apps/web/src/lib/faq.ts`) already quotes several of them (fee, refund window, expiry, hold, minimum payout). The Terms must match the FAQ when filled.
- In the current code, earned points expire after a set time, but the FAQ says cash-out is not open yet. Make sure earnings cannot expire before a distributor can withdraw them.
- The code prices top-ups and payouts in **USD**, but Terms §12 has a liability floor in **MYR**. Decide one currency.
- In the code, an admin can refuse a payout and the points return to the member. If points can also be cancelled for fraud, both the Terms and the code need that rule.
- Decide whether a screen that only its owner watches can earn. The FAQ mentions laptops and phones as screens.

---

## Review findings still open (15 Sep 2026)

Found in the 15 Sep review and **not yet applied**. Items marked *(code)* need a product or engineering change, not only drafting.

### Product description and wording
1. The drafts describe ads on web/browser-based placements “outside X or Threads” and repeat that there is no Mac menu-bar app. The product code builds a screen app (a PWA in a browser) for screens in rooms — cafes, restaurants, salons, gyms, clinics, shops, offices — with a code that viewers scan.
2. The drafts say “Distributor Op” and “Advertiser / Business”, and still use “impression” in a few places. The dashboard and FAQ say distributor, advertiser, play, and scan.

### Terms of Service
3. **Contracting party.** If SA0656426-A is a registration under the Registration of Businesses Act 1956 (sole proprietorship or partnership), the business is not a separate legal entity, and the owner is personally liable. Counsel to confirm the party wording, and whether a company should hold the contract.
4. **Distributor duties are missing:** the venue owner’s permission to place the screen and show ads; local council advertising permits where a screen faces a public area; public performance licences for music or video the screen plays in a business; no identifiable people in the screen photo; responsibility for the news feed and for their own promotion (no admin reviews the promotion).
5. **Advertiser duties are missing:** domain verification before a campaign runs.
6. **Removal delay.** A screen holds cached plays for up to 240 minutes, so a removed, rejected, or paused listing can stay on screen that long. State the delay in the Terms and the Ads Policy.
7. **Change clause.** All three drafts say routine or minor updates are not announced, and that continued use means acceptance. Changes to earnings or billing rules need advance notice.
8. **Acceptance step** *(code)*: the sign-up page and the top-up dialog show no link to the Terms or the Privacy Policy.

### Privacy Policy
9. **PDPA form (counsel to confirm):** the PDPA works through its seven data protection principles, not GDPR-style legal bases; Section 7 requires the notice in **Bahasa Malaysia and English**; the notice must say which data is obligatory and what happens if it is not given; the complaint authority is the **Personal Data Protection Commissioner**; the 2024 amendments added breach notification, a data protection officer, data portability, and new cross-border transfer rules.
10. **Hosting region.** The code deploys the API and the database on Railway in **Singapore** (`asia-southeast1`). §9 and §13.3 must reflect this.
11. **Screen photos** *(code)*: uploads are stored at public URLs, so anyone with the link can open a photo of a venue. Consider private storage, then fill `[TBD: confirm who can access uploaded photos]`.
12. **Account deletion** *(code)*: the dashboard deletes accounts, but the database either deletes the member’s financial records with the account, or refuses the delete for a distributor whose screens have plays. Privacy §7 (retention) and Terms §14 (closure) need a defined rule first.
13. **Weather service** *(code)*: the screen calls Open-Meteo. Its free API is for non-commercial use only, and its data licence (CC BY 4.0) requires attribution. The screen shows no attribution.
14. **Processors found in the code** (for `[TBD: list or link sub-processor list]`): Railway (API and Postgres), Vercel (dashboard), Resend (email), S3-compatible file storage (Cloudflare R2 according to an env comment), Google (sign-in and Google Fonts), Open-Meteo (weather, called by the screen). Payment and payout providers: `[to fill in later]`.
15. **Cookies.** The code sets only the Better Auth session cookies, and no analytics tools were found. The dashboard and the screen app also use browser storage.
16. **Web legal pages** *(code)*: `/terms`, `/privacy`, `/refund`, `/cookies`, `/dpa`, and `/security` on the marketing site hold only `TODO` text, and there is no `/ads-policy` page. The `/dpa` page is GDPR processor text that may not apply.

### Ads Policy
17. **Format rules** do not match the product. An advertiser supplies a logo, a name, a tagline of up to 60 characters, and a URL, and the screen app draws the listing. The rules on animation, audio, pixels, SVG, and executables cover files that cannot be uploaded.
18. **File size:** the draft says under 1 MB; the code accepts up to 5 MB.
19. **HTTPS:** the draft requires HTTPS; the code accepts `http://` campaign URLs.
20. **Review:** the draft says “automated and/or human review”; a person reviews every listing and screen, and only the domain check is automatic.
21. **Veto** *(code)*: a listing that a distributor vetoes after the screen cached it still shows and is still billed. The FAQ says a veto stops at once.
22. **The distributor’s own promotion** is not covered by the Ads Policy, and nobody reviews it.
23. **English-only title and tagline** — product to confirm for Malaysian venues.

---

## What was adapted from SponsorBar / KickBot-style references (structure only)

Adapted **structure and spirit**, not brand, product model, or jurisdiction copy-paste:

| Reference theme | How adapted for CapyChannel |
|-----------------|--------------------------------|
| Parties / roles | **Advertisers/Businesses** + **Distributor Ops**. Placement for **v1** is **web/browser-based**; ads distributed **outside X/Threads**. |
| Eligibility, accounts, license | Same high-level sections; Malaysia operator; no SF address / US corp invent. |
| Impressions / measurement | Section heading kept; content is **`[to fill in later]`** until the wallet and payment system is complete (15 Sep). |
| Earnings / billing | Section headings kept; content is **`[to fill in later]`** (15 Sep). No commercial numbers in the drafts. |
| Prohibited conduct, IP, disclaimers, liability, termination, changes | Covered; disclaimers flagged for Malaysian counsel. |
| Governing law / disputes | **Laws of Malaysia**; disputes in **Malaysian courts**; optional mediation/arbitration as counsel note only — **no** mandatory US arbitration / class-waiver as default. |
| Privacy: account + ops signals | Browser/session **eligibility** signals; explicit **non-collection** of keystrokes, unrelated screenshots, mic/cam, etc. Data list aligned with the code on 15 Sep. |
| Privacy: ads reporting | Aggregate reporting; limited targeting assumptions. |
| Privacy: GDPR / CCPA | Added 15 Sep as regional sections (§13, §14) and one data-request process (§15). |
| Ads creative rules | Kept spirit of required/prohibited lists; **no** animation/audio/pixels/SVG/exe unless TBD for CapyChannel. Malaysia-specific categories and a venue-fit rule added 15 Sep. |
| Review / suspension | May reject/pause; balances, refunds, and adjustments **`[to fill in later]`**. |

**Explicitly not copied as if identical product:** SponsorBar Mac-only menu bar, KickBot branding, Stripe/Whop-specific fee tables, San Francisco address, US class-arbitration boilerplate as binding default, or any invented Malaysian statute citations as legal conclusions. **v1 does not promise native Mac/display clients.**

---

## Product model reminder (for reviewers)

- **Advertisers / Businesses** buy/distribute ad creatives via CapyChannel to eligible **web/browser-based** placements outside social platforms like X/Threads.  
- **Distributor Ops** earn by showing approved ads through **browser sessions / web players** they control.  
- Operator: **Praxor Studio (SA0656426-A)**; public product name: **CapyChannel**.  
- **v1:** website only (open in browser).  
- See **Review finding 1**: the product code runs on screens in venues, with a code that viewers scan.

---

## Remaining `[TBD: …]` placeholders (after 16 Sep changes)

Counsel / product should resolve before publication. Point-system and payment-system items are **not** listed here; they are `[to fill in later]` (see above).

### Name, contacts & address
- **[TBD: mailing address]** — still open  
- Support URL: no separate URL locked; `support@capychannel.site` used for now  
- `[TBD: dedicated privacy address or web form]` (Privacy §15)

### Legal / compliance — Malaysia
- `[TBD: optional mediation/arbitration clause for counsel — do not treat US-style class-waiver arbitration as default]`
- `[TBD: counsel to confirm independent-contractor / platform wording under Malaysian law.]`
- `[TBD: counsel to align disclaimer language with Malaysian law]`
- `[TBD: counsel review of indemnity scope.]`
- `[TBD: floor amount in MYR]` / liability lookback months
- ~~`[TBD: English / Bahasa Malaysia]` controlling language~~ — **resolved 16 Sep: English controls.** New open item: `[TBD: counsel to confirm this against PDPA Section 7 …]` (Privacy §17)
- `[TBD: counsel to define “major” examples; channels]` / `[TBD: counsel / channels]`
- `[TBD: confirm controller vs processor roles for any sub-processors]`
- `[TBD: map each purpose to the PDPA principles with counsel]`
- `[TBD: list primary hosting regions / transfer safeguards]`
- `[TBD: PDPA transfer compliance steps for counsel]`
- `[TBD: name Malaysian authority / process]` (complaints)
- `[TBD: counsel on “sale” / PDPA disclosure wording]`
- `[TBD: counsel to confirm response times]` (PDPA requests, Privacy §15)
- `[TBD: counsel to confirm fee policy, including any PDPA fees]`
- `[TBD: list or link sub-processor list]` / `[TBD: list key processors when selected]`
- `[TBD: DMCA-like / notice channel — adapt for Malaysia]`
- `[TBD: geo availability / restricted territories]`
- `[TBD: geo-policy matrix]`

### Legal / compliance — GDPR (Privacy §13)
- `[TBD: counsel to confirm when the EU GDPR and the UK GDPR apply …, and whether Praxor must appoint an EU and/or UK representative (GDPR Article 27)]`
- `[TBD]` EU / UK representative
- `[TBD: whether one is required]` data protection officer
- `[TBD: counsel to confirm each basis, and to record a balancing test for each legitimate interest]`
- `[TBD: counsel to confirm once the fraud-review and payout rules are final]` (automated decisions)
- `[TBD: counsel to confirm transfer mechanisms]`

### Legal / compliance — California (Privacy §14–§15)
- `[TBD: counsel to confirm whether the CCPA applies to Praxor …]` — thresholds quoted in the draft; decide whether to keep §14 as a voluntary commitment if they are not met
- `[TBD: counsel to confirm its status]` (weather service as a recipient of screen coordinates)
- `[TBD: counsel to confirm the full category list]`
- `[TBD: set a retention period or criteria for each category]`
- `[TBD: counsel to confirm once analytics tools and payment providers are chosen]` (no sale / no sharing)
- `[TBD: counsel to check whether the CCPA regulations on automated decision-making technology, risk assessments, or cybersecurity audits apply]`
- `[TBD: counsel to confirm that an email address is enough …]` (request methods)

### Legal / compliance — Ads Policy categories (Ads §4)
Statute names below are pointers for counsel to confirm, **not** legal conclusions.
- `[TBD: any licensed exception for Malaysia counsel]` (gambling)
- `[TBD: whether any civic/psa exception]` (political)
- `[TBD: counsel to confirm against the Control of Smoking Products for Public Health Act 2024]` (tobacco, vapes)
- `[TBD: whether any venue-limited exception applies]` (alcohol)
- `[TBD: counsel to confirm against the Medicines (Advertisement and Sale) Act 1956, and whether ads for clinics and other health services need prior approval]`
- `[TBD: whether licensed moneylenders may advertise; counsel to confirm against the Moneylenders Act 1951]`
- `[TBD: counsel to confirm against the Direct Sales and Anti-Pyramid Scheme Act 1993]`
- `[TBD: counsel to confirm against the Trade Descriptions Act 2011 and its halal orders]`
- `[TBD: counsel to confirm scope]` (race, religion, and royalty)
- `[TBD: whether some categories may run only in venues that suit them, and how Distributor Ops set venue restrictions]` (venue fit)

### Product / privacy feature flags
- `[TBD: creative specs per surface]` (v1 = web/browser)
- `[TBD: exact eligibility signals for v1 surfaces]`
- `[TBD: whether phone is required]`
- `[TBD: auth method]` / `[TBD: confirm whether Google sign-in is offered at launch]`
- `[TBD: KYC / verification requirements and providers]`
- `[TBD: location precision]` (screen location)
- `[TBD: confirm who can access uploaded photos]` (see Review finding 11)
- `[TBD: confirm whether hosting-provider request logs keep IP addresses, and for how long]` (scans)
- `[TBD: confirm product never captures user desktop content; if any limited capture for ad-slot QA is ever added, it must be disclosed and consented]`
- `[TBD]` audio / `[TBD]` SVG / `[TBD: any advertiser pixel / S2S conversion exceptions]`
- `[TBD: whether offered; default draft assumes limited / contextual / eligibility-based targeting unless product expands]`
- `[TBD: confirm reporting granularity]`
- `[TBD: analytics tools]`
- `[TBD: cookie banner / consent mechanism if required for target markets.]`
- `[TBD: marketing consent approach]`
- `[TBD: retention period after closure]` / `[TBD: years]` / `[TBD: log retention]` / `[TBD: retention period]` (screen photos)
- `[TBD: account closure process]` (see Review finding 12)
- `[TBD: SLA if any]` (ads review)
- `[TBD: minimum age]` is resolved in the drafts as **18**; no age check exists at sign-up

### Resolved (do not re-ask)
- ~~v1 surfaces / device clients~~ → **website / browser only**
- ~~governing law / venue~~ → **Malaysia / Malaysian courts**
- ~~product name~~ → **CapyChannel** (16 Sep)
- ~~primary domain~~ → **`capychannel.site`** (16 Sep)
- ~~contact email~~ → **`support@capychannel.site`** (16 Sep)
- ~~controlling language~~ → **English controls over any translation** (16 Sep)

---

## Review checklist (suggested for KEV-6)

1. ~~Confirm the **product name**.~~ Done: **CapyChannel**. The domain and the email are set. Fill the **mailing address** — it is the last identity item.  
2. Finish the **wallet and payment system** and set up the **payment system**. Then fill every `[to fill in later]`, and match the public FAQ.  
3. Malaysian counsel: contracting party, PDPA (bilingual notice, 2024 amendments), consumer/limitation language, independent-contractor wording, optional mediation clause, and the new ad categories.  
4. Privacy counsel: whether the GDPR and the CCPA apply, the Article 27 representative, transfer mechanisms, and the CCPA category list.  
5. Work through **Review findings still open**, including the *(code)* items.  
6. Confirm the **non-collection** commitments match the actual web client (no desktop screenshots/keyloggers).  
7. Human approve → then publish; drafts alone are not live terms. **Do not auto-publish to Linear or GitHub from drafting agents.**

---

## Agent constraints honored

- Research/structure adapted from provided SponsorBar-style summaries only; no invented Malaysian statute conclusions. Statute names in the new ad categories are counsel pointers, not conclusions.  
- No Stripe/Whop or 70/30 figures invented. Since 15 Sep, no point-system numbers are taken from the product code either, because the wallet and payment system is not final.  
- No Linear publish / no outbound messaging / no GitHub publish from the drafting agent.  
- Success criterion: three full markdown drafts + this README updated on disk in this folder.
