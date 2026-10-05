# Payout rails for CapyAds distributors

- **Question**: Which provider can pay a CapyAds distributor USD 10 to 50 in local currency, from a Malaysian sole-proprietor business (ROB registration, not a Sdn Bhd), to a bank account in TH, MY, SG, US, JP, KR, ID, BN, VN or PH, with a self-serve API?
- **Date**: 2026-09-29
- **Status**: research note, not a decision
- **Method**: primary sources only (provider pricing pages, docs, API reference, terms and help articles). Every claim carries its URL and the date I read it. All pages were read on 2026-09-29. Where a number is not on a primary page, the note says "not published".

## Comparison at a glance

| Provider | Sender eligibility from MY (sole proprietor) | Fee shape for the sender | Coverage of the 10 | Recipient gets local currency? | API self-serve? | Min payout |
|---|---|---|---|---|---|---|
| **Airwallex** (MY entity, BNM MSB Class B) | Yes for a Malaysia-registered business. The help centre asks for a "fully incorporated" company and lists company documents only. Sole-proprietor acceptance is not published. | Local rails: 0 MYR. SWIFT: 30 MYR (SHA) or 90 MYR (OUR). FX: 0.40% majors, 0.60% IDR, KRW, PHP, THB, VND. No monthly fee. | 9 of 10 on local rails. Brunei is SWIFT only, and BND is not a supported currency. | Yes, on local rails in THB, MYR, SGD, USD, JPY, KRW, IDR, VND, PHP. | Yes. Keys come from the web app (Owner, Admin or Developer role). Sandbox is public. | No minimum published for transfers. VND local has a 10,000 VND minimum. FX conversion minimum is USD 10. |
| **Payoneer** (Mass Payouts) | Not published for a MY sole proprietor as a sender. Mass Payouts is sold to "marketplaces, platforms, and enterprises". Credentials come from the integration team during account set-up. | Retail published: up to 1% + up to USD 4.00 per payment to a Payoneer account in another country. Mass Payouts price is custom. | 10 of 10 can hold a Payoneer account. Withdrawal in local currency is listed for TH, MY, SG, US, JP, KR, PH, VN. ID and BN are not in the same-country list. | Yes for 8 of 10, after the recipient withdraws. Withdrawal costs 1.2% to 4% with a minimum fee of up to USD 20 in some countries. | Partly. Sandbox is public, but production credentials come from Payoneer during account set-up. | Payouts: not published. Withdrawal: "unique to each user"; one Payoneer guide says "usually $50". |
| **Trolley** | **No.** Trolley onboards businesses registered in the US, Canada, EEA, UK and Gibraltar, Australia or New Zealand only. | Standard plan USD 2,399 a year. Per payment: ACH USD 1.00, local international routes USD 4.00, wire with FX USD 10.00, PayPal USD 0. FX 2.00%. | 10 of 10 listed. Local route for MY, SG, US, ID, PH. Wire for TH, JP, KR, BN, VN. | Yes, all 10 currencies listed, but 5 arrive by wire. | Yes, keys from the dashboard. But the sender cannot onboard. | Route minimum exists per recipient (`routeMinimum`). Numbers not published on a page I could read. |
| PayPal Payouts (fallback) | Yes, MY is a "send" country. But a MY user cannot send a payment that needs an exchange to or from MYR. | 2% per payment, capped at USD 50 (international) from MY. | 7 of 10. TH, KR and BN are not in the eligible table. | Only after the recipient converts inside PayPal. Conversion is not available for TH and KR. | Yes, Payouts API after PayPal enables it. | Not published. Max USD 20,000 per payout. |
| Wise Business (fallback) | **No.** "Malaysia doesn't have Business yet." | n/a | n/a | n/a | n/a | n/a |

**Summary**: Airwallex is the only one of the three that a Malaysian business can open by itself, that pays 9 of the 10 countries on local rails, and that gives a self-serve Payouts API. Its open risk is the entity type: the help centre asks for an incorporated company. Trolley refuses a Malaysian sender. Payoneer is a sales-led enterprise product with a fee shape that eats 22% to 28% of a USD 20 payout at published retail rates. Wise Business does not exist in Malaysia. PayPal is a usable fallback for 7 countries but not for TH, KR or BN.

## Airwallex

### 1. Sender eligibility
- Airwallex (Malaysia) Sdn Bhd is licensed in Malaysia. The MY blog states "MSB Class B (remittance business only) licensee ... Bank Negara Malaysia (licence number 00318)". Source: https://www.airwallex.com/en-my/blog/how-does-airwallex-work-malaysia (read 2026-09-29).
- Malaysia is on the eligible-countries list. The row reads "MALAYSIA | MY | MALAYSIA" (the onboarding entity is the Malaysian one). Source: https://help.airwallex.com/hc/en-gb/articles/4408591334937-Eligible-Countries-and-Territories (read 2026-09-29).
- The eligibility article says: "Your company must be an officially registered and active business. This means it must be fully incorporated and in good standing." It does not mention sole traders. Source: https://help.airwallex.com/hc/en-gb/articles/900001757026-Eligibility-to-open-an-account (read 2026-09-29).
- The Malaysia documents article lists only company documents: Certificate of Incorporation, Register of Directors, Register of Members, an ownership chart and a partnership form. It does not mention a sole proprietorship or the SSM Form D. Source: https://help.airwallex.com/hc/en-gb/articles/4591058176015-Documents-required-for-companies-in-Malaysia (read 2026-09-29).
- The South East Asia documents article covers VN, PH, ID, IN and TH, and accepts sole proprietors only for the Philippines (DTI-registered). It does not cover Malaysia. Source: https://help.airwallex.com/hc/en-gb/articles/12004460708111-Documents-required-for-companies-in-South-East-Asia (read 2026-09-29).
- Product: the standard Airwallex Business Account with Transfers, Batch Transfers and the Payouts API. No monthly fee, no setup fee, no minimum balance. Source: https://www.airwallex.com/my/pricing (read 2026-09-29).
- Volume minimum: none published. Approval: the standard KYB application. "API Integration Set Up Fee: To be advised." Source: https://www.airwallex.com/en-my/terms/fee-schedule (read 2026-09-29).

### 2. Fees to the sender per payout
- Local transfer methods: "FREE". SWIFT: "30 - 90 MYR for SWIFT transfer methods (SHA and OUR)". FX: "0.4% above interbank exchange rates for USD, SGD, CNY, AUD, HKD, EUR, GBP, CAD, CHF, NZD, JPY, IDR, INR, PHP, THB, VND, KRW" and "1.0% above interbank exchange rates for all other currencies". Source: https://www.airwallex.com/my/pricing (read 2026-09-29).
- The fee schedule (terms page) gives: Local Payment Fee 0 MYR; SWIFT (SHA) 30 MYR per payment; SWIFT (OUR) 90 MYR per payment; FX margin 0.40% for AUD, USD, HKD, CNY, JPY, EUR, GBP, CAD, CHF, NZD, SGD, MYR; 0.60% for IDR, KRW, PHP, THB, VND, INR, NPR, PKR, BDT, TRY, LKR; 0.60% for all other currencies. Monthly account fee 0 MYR. Source: https://www.airwallex.com/en-my/terms/fee-schedule (read 2026-09-29).
- Conflict: the pricing page says 0.4% for THB, VND, KRW, IDR and PHP; the fee schedule says 0.60%. This note uses 0.60% as the worst case.
- The older PDF fee schedule (March 2022) gives 0.30% majors, 0.60% others, SHA 30 MYR, OUR 90 MYR, Fedwire 60 MYR for USD. It is superseded by the terms page. Source: https://assets.ctfassets.net/e6wv1zvbwa49/5aEO9BxIfdR0in3Pbl6leu/8418c39436f996b5bd032e9282302171/_March_2022__Airwallex_MY_-_Fee_Schedule.docx.pdf (read 2026-09-29).
- Local vs SWIFT: the pricing page says "94% of transfers are routed through local payment rails". Source: https://www.airwallex.com/my/business-account/transfers (read 2026-09-29).

### 3. Fees to the recipient
- Local rails: Airwallex charges the recipient nothing. The recipient's own bank may charge an incoming fee. Not published by Airwallex.
- SWIFT SHA: "Beneficiary will receive the amount transferred less the intermediary banks' fees." SWIFT OUR: "The client pays for the wire transfer fees charged by intermediary banks." Source: https://www.airwallex.com/en-my/terms/fee-schedule (read 2026-09-29).
- The API lets the sender choose `fee_paid_by` (PAYER default, or BENEFICIARY) and `swift_charge_option` (SHARED default, or PAYER). Source: https://www.airwallex.com/docs/api/payouts/transfers/create (read 2026-09-29).
- No FX on the recipient side: Airwallex converts before it sends, so the recipient gets local currency.

### 4. Coverage of the 10 countries
Source for all rows: the payout network pages under https://www.airwallex.com/docs/payouts/payout-network/bank-accounts (read 2026-09-29).

| Country | Local rail | Local currency | Flight time | Notes |
|---|---|---|---|---|
| TH | Yes | THB | 0 to 1 days | Above 2,000,000 THB it routes via BAHTNET. Page: `/thailand` |
| MY | Yes (DuitNow, RENTAS) | MYR | 0 to 2 days | DuitNow ID accepted. Page: `/malaysia` |
| SG | Yes (FAST, GIRO, RTGS) | SGD | 0 to 1 days | PayNow IDs accepted. Page: `/singapore` |
| US | Yes (ACH, Next Day ACH, FedNow, Fedwire) | USD | 0 to 2 days | Page: `/united-states` |
| JP | Yes (Zengin) | JPY | 0 to 1 days | Max 1,000,000 JPY. "pre-registration is required to enable local JPY payout capabilities". Page: `/japan` |
| KR | Yes (HOFINET) | KRW | 0 to 1 days | Max 1,000,000,000 KRW. Bank code needed. Page: `/korea-republic-of` |
| ID | Yes (SKN, BI-FAST, iACH) | IDR | 0 to 2 days | Max 300,000,000 IDR. Page: `/indonesia` |
| BN | **No. SWIFT only.** | **BND not supported.** | 0 to 3 days | The recipient must hold an account in one of 22 SWIFT currencies (USD, SGD, JPY, ...). Page: `/brunei-darussalam` |
| VN | Yes (NAPAS) | VND | 0 to 1 days | Min 10,000 VND. Max 499,999,999 VND. Page: `/viet-nam` |
| PH | Yes (InstaPay, PesoNet) | PHP, USD | 0 to 1 days | Above 50,000 PHP it routes via PesoNet. Page: `/philippines` |

### 5. Recipient onboarding
- The sender collects bank details and creates a beneficiary. The recipient needs no Airwallex account. Each country page lists the required fields (account name, account number, SWIFT or bank code, country). Source: the payout network pages above (read 2026-09-29).
- No KYC on the recipient by Airwallex is published. The Japan page notes "first_name and last_name (for individual beneficiaries)". Source: https://www.airwallex.com/docs/payouts/payout-network/bank-accounts/japan (read 2026-09-29).

### 6. API
- API reference: https://www.airwallex.com/docs/api (Payouts: Beneficiaries, Transfers). Create a transfer: https://www.airwallex.com/docs/api/payouts/transfers/create. Batch transfers: https://www.airwallex.com/docs/payouts/batch-transfers/create-a-batch-transfer (read 2026-09-29).
- Self-serve: "Log in to the Airwallex web app and select Developer > API keys". Roles: "Owner, Admin, or Developer user role". Sandbox and production keys are separate. Source: https://www.airwallex.com/docs/developer-tools/api/manage-api-keys (read 2026-09-29).
- Any extra approval for production Payouts is not published on that page.

### 7. Minimum payout amount
- No minimum for transfers is published in the fee schedule or the limits article. "Limits will vary depending on the transfer method, payee type and account configuration." Source: https://help.airwallex.com/hc/en-gb/articles/900001756666-What-are-the-limits-for-payouts-and-deposits-on-my-account (read 2026-09-29).
- Vietnam local: minimum 10,000 VND (about USD 0.40). Source: https://www.airwallex.com/docs/payouts/payout-network/bank-accounts/viet-nam (read 2026-09-29).
- Currency conversion: "the minimum amount is set at $10 USD". A USD 10 payout with conversion sits exactly on this line. Source: https://help.airwallex.com/hc/en-gb/articles/900001759663-Is-there-a-minimum-and-maximum-limit-to-the-amount-I-can-convert (read 2026-09-29).
- The API returns `amount_below_transfer_method_limit` when a transfer is too small. Source: https://www.airwallex.com/docs/api/payouts/transfers/create (read 2026-09-29).

## Payoneer

### 1. Sender eligibility
- Product: "Mass Payouts" (also "Payoneer for Enterprise"). The page targets "marketplaces, platforms, and enterprises that regularly pay large numbers of recipients globally". Coverage "190+ countries and territories", "70+ currencies". Source: https://www.payoneer.com/marketplace/mass-payouts-platform/ and https://www.payoneer.com/mass-payouts/ (read 2026-09-29).
- Whether a Malaysian sole proprietor can be a Mass Payouts sender is not published. The pricing page says "Processing over 50K USD monthly? Get in touch to discuss pricing". Source: https://www.payoneer.com/pricing/ (read 2026-09-29).
- Account opening: individual accounts for "Freelancers, self-employed, consultants" and corporate accounts for "Companies, agencies, legal entities". Verification takes "1 to 3 business days". Source: https://www.payoneer.com/resources/how-open-a-payoneer-account-how-much-does-it-cost/ (read 2026-09-29).
- Minimum volume: not published. Monthly platform fee: not published. Malaysian licence: not published.

### 2. Fees to the sender per payout
- Published retail rates. To a Payoneer account, same country: "Up to 4.00 USD / EUR / GBP". Different country: "Up to 1% + Up to 4.00 USD or equivalent". Source: https://www.payoneer.com/pricing/ (read 2026-09-29).
- Mass Payouts pricing: not published. The mass payouts pages carry no numbers.
- The legacy API guide says "Amount charged to payees are deducted from this amount" for the Fees field, so a client can push its fee onto the payee. Source: https://partners.sandbox.payoneer.com/Files/APIGuide.pdf (read 2026-09-29).

### 3. Fees to the recipient
- Withdrawal to a bank in the same country in local currency: 1.50 USD, in the listed countries. To a bank "in the recipient's local currency (no currency conversion)": "1.2% – 4%". With currency conversion: "1.2% – 4%". "In some countries, a minimum fee of up to 20.00 USD or equivalent may apply." Source: https://www.payoneer.com/pricing/ (read 2026-09-29).
- An older help article says "up to 2%" for a withdrawal in a different currency. The pricing page is newer and wider. Source: https://www.payoneer.com/resources/how-to-use-payoneer/how-payoneer-calculates-withdrawal-fees/ (read 2026-09-29).
- Annual account fee: "29.95 USD. Only applies if account receives less than 6,000.00 USD or equivalent in any 12 consecutive months." A CapyAds distributor earns at most about USD 360 a year, so this fee applies to every distributor. Source: https://www.payoneer.com/pricing/ (read 2026-09-29).
- Bank-side fees: "Processing fees, landing fees, or intermediary fees may be deducted from the withdrawn amount by your bank". Source: https://www.payoneer.com/resources/how-to-use-payoneer/how-payoneer-calculates-withdrawal-fees/ (read 2026-09-29).

### 4. Coverage of the 10 countries
- The pricing page lists the countries where a withdrawal "to a bank account in the same country as yours, in local currency" is supported: "All EU countries, USA, Australia, Bulgaria, Canada, China, Czech Republic, Japan, Kenya, South Korea, Mexico, Malaysia, Norway, New Zealand, Philippines, Poland, Romania, Saudi Arabia, Sweden, Singapore, Thailand, Vietnam, ... UK ...". Source: https://www.payoneer.com/pricing/ (read 2026-09-29).

| Country | On the same-country local-currency list | Note |
|---|---|---|
| TH | Yes | |
| MY | Yes | |
| SG | Yes | |
| US | Yes | 1.50 USD flat |
| JP | Yes | |
| KR | Yes | |
| ID | **Not listed** | A withdrawal path may exist under the 1.2% to 4% row. Not published. |
| BN | **Not listed** | Not published. |
| VN | Yes | |
| PH | Yes | |

- The direct "pay to bank" path of Mass Payouts (no Payoneer account) exists: "Payments to recipient bank accounts". Its country list and fees are not published. Source: https://www.payoneer.com/developers-docs/mass-payout/ (read 2026-09-29).

### 5. Recipient onboarding
- The recipient needs a Payoneer account. "Payees complete self-serve registration"; the sender embeds the registration page or sends a link. Source: https://www.payoneer.com/mass-payouts/ (read 2026-09-29).
- KYC for an individual: passport or ID, tax number, proof of address. Source: https://www.payoneer.com/resources/how-open-a-payoneer-account-how-much-does-it-cost/ (read 2026-09-29).

### 6. API
- API reference: https://developer.payoneer.com/docs/mass-payouts-v4.html and https://developer.payoneer.com/docs/mass-payouts-v4-getting-started.html. The body renders with JavaScript; the fetch tool read only the headings.
- Endpoints (from the developer platform page): "Create registration-link for payee onboarding", "Create instant payouts to various different payout methods", "Submit payouts along with China SAFE order reporting". Source: https://www.payoneer.com/developers-docs/mass-payout/ (read 2026-09-29).
- Access is not self-serve. "Credentials for submitting API calls to sandbox and production environments will be provided during the client account setup process." "Sandbox credentials will be sent by Payoneer's integration Department via email." Source: https://partners.sandbox.payoneer.com/Files/APIGuide.pdf (read 2026-09-29).
- A Payoneer article says: "Submit a partnership request ... After confirming the partnership, the platform provides unique keys (Client ID and Secret)". Source: https://www.payoneer.com/resources/business/payoneer-integration-api-marketplace-solutions/ (read 2026-09-29).

### 7. Minimum payout amount
- Payout minimum: not published. The legacy guide has an error code "Payments lower than the minimum". Source: https://partners.sandbox.payoneer.com/Files/APIGuide.pdf (read 2026-09-29).
- Withdrawal minimum: "These details are unique to each Payoneer user". Source: https://payoneer.custhelp.com/app/answers/detail/a_id/18605/~/withdraw-to-bank---faq (read 2026-09-29). A Payoneer guide says "The minimum withdrawal amount is usually $50." Source: https://www.payoneer.com/resources/how-to-withdraw-money-from-payoneer/ (read 2026-09-29). A USD 20 payout can sit in the recipient's balance until it reaches that line.

## Trolley

### 1. Sender eligibility
- **A Malaysian business cannot onboard.** The FAQ says Trolley works with businesses with offices in "the US, Canada, Australia, New Zealand, the UK, or the European Economic Area" and is "actively working to expand the list of countries". Source: https://trolley.com/faqs/ (read 2026-09-29).
- Product: "Trolley Pay" on the Standard plan. Source: https://trolley.com/trolley-pricing/ (read 2026-09-29).
- Onboarding: a business profile and a banking application; bank transfers start "in a few business days". 30-day free trial. Source: https://trolley.com/faqs/ (read 2026-09-29).
- Malaysian licence: none published.

### 2. Fees to the sender per payout
- Platform: Standard "Pay" USD 2,399 a year. Trolley Plus: sales quote. Per payment (USD examples): ACH USD 1.00; international SEPA, FPS, NPP, EFT USD 4.00; wire with FX USD 10.00; wire without FX USD 25.00; PayPal USD 0.00; debit card 1.00% with USD 1.50 minimum. FX margin 2.00%, "reducible at higher volumes". Source: https://trolley.com/trolley-pricing/ (read 2026-09-29).
- Instant international payouts: 1.00% with a USD 4.00 minimum plus FX. Source: https://trolley.com/pay/instant-payout-methods/ (read 2026-09-29).
- The per-payment price for the IDR and PHP local routes is not published as a number.

### 3. Fees to the recipient
- Trolley publishes no recipient fee. The sender may "carry, split, or pass payout fees to recipients". Source: https://trolley.com/pay/ (read 2026-09-29).
- A wire under SHA can lose intermediary fees. Not published by Trolley.

### 4. Coverage of the 10 countries
Source: the country table on https://trolley.com/platform/global-payout-network/ (read 2026-09-29).

| Country | Currency | Route |
|---|---|---|
| TH | THB | Wire |
| MY | MYR | Local |
| SG | SGD | Local |
| US | USD | Local |
| JP | JPY | Wire |
| KR | KRW | Wire |
| ID | IDR | Local |
| BN | BND | Wire |
| VN | VND | Wire |
| PH | PHP | Local |

### 5. Recipient onboarding
- The sender collects details through a hosted portal, a widget or the API. The recipient gives address, bank details, identity documents, phone verification and tax forms where relevant. No separate Trolley account. Source: https://trolley.com/platform/recipient-management/ (read 2026-09-29).

### 6. API
- Reference: https://developers.trolley.com/api/. Keys: "Trolley Dashboard > Settings > API Keys". Base URL `https://api.trolley.com/v1/`. Resources: recipients, batches, payments. Sandbox and live keys are separate. Source: same page (read 2026-09-29).

### 7. Minimum payout amount
- Each recipient carries a `routeMinimum` field: "the lowest amount sendable via their active payout route". Source: https://developers.trolley.com/api/ (read 2026-09-29).
- The support article "Bank Transfer Payment Minimums" (https://support.trolley.com/s/article/Bank-Transfer-Payment-Minimums) renders with JavaScript. I could not read its numbers.

## Fallback 1: PayPal Payouts from a Malaysian business account

- Malaysia row: "Malaysia | Send, receive, and withdraw in local currency | MY". Restriction: "Malaysian users cannot send payments that require exchange to or from MYR". So a MY sender must hold and send USD. Source: https://developer.paypal.com/docs/payouts/standard/reference/country-feature/ (read 2026-09-29).
- Fee from the MY fee page: "2% of total transaction amount (not to exceed the ... maximum fee cap)". Caps for MY: domestic 4.00 MYR or 1.00 USD; international 200.00 MYR or 50.00 USD. Recipients pay no Payouts fee. Source: https://www.paypal.com/my/webapps/mpp/merchant-fees (read 2026-09-29).
- Countries among the 10 in the eligible table: MY, SG (fully localized), US (fully localized), JP (fully localized), ID (send, receive, withdraw), VN (send, receive, withdraw), PH (send, receive, withdraw in local currency). **TH, KR and BN are absent.** Currency conversion is "not available for payouts to" South Korea and Thailand. Source: https://developer.paypal.com/docs/payouts/standard/reference/country-feature/ (read 2026-09-29).
- Cap: USD 20,000 per payout by default. Up to 5,000 payments per batch. Source: https://developer.paypal.com/docs/payouts/standard/reference/faq/ (read 2026-09-29).
- Recipient conversion: the recipient converts USD inside PayPal at PayPal's rate plus a spread set by the recipient's country. The MY page shows 2.5% to 4.0% for MY accounts. The recipient-country number is not published on the MY page.

## Fallback 2: Wise Business from Malaysia

- "Malaysia doesn't have Business yet." Source: https://wise.com/my/business/ (read 2026-09-29).
- "Bahrain, Israel, Malaysia — you can only hold money in personal accounts, not business accounts." Source: https://wise.com/help/articles/2813542/where-do-i-need-to-live-to-hold-money-with-wise (read 2026-09-29).
- The Wise Platform docs say business accounts "in the US, Canada, Australia, New Zealand, Singapore, and Malaysia" can fund transfers via the API. This conflicts with the two pages above. Source: https://docs.wise.com/guides/product/send-money/use-cases/payouts-smbs (read 2026-09-29). The fee shape for such an account is the per-transfer Wise fee. No MY business fee page exists.

## Worked example: USD 20 and USD 50 payouts

Assumptions:
- The ledger and the funding balance are in USD. The provider converts to local currency before it pays.
- Airwallex: local rail, fee 0 MYR, FX 0.60% for THB, IDR, PHP, VND (fee schedule tier), 0.40% for JPY, none for USD. The recipient's bank fee is not published and is set to 0.
- Payoneer: published retail rates, because the Mass Payouts price is not published. Sender "up to 1% + up to USD 4.00". Recipient withdraws with conversion at 1.2% to 4%; US recipient pays USD 1.50 flat. The annual fee of USD 29.95 is not in the table; it applies to every distributor who receives under USD 6,000 a year.
- Trolley: the sender cannot onboard from Malaysia. The rows are hypothetical and exclude the USD 2,399 yearly plan.
- PayPal: sender 2%, no cap hit. The recipient conversion spread is not published for each country.

| Recipient | Payout | Airwallex sender fee | Airwallex recipient fee | Airwallex lost | Payoneer sender fee | Payoneer recipient fee | Payoneer lost | Trolley (hypothetical) sender fee | Trolley lost | PayPal sender fee | PayPal lost |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TH | 20 | 0.12 (FX) | 0 | 0.6% | up to 4.20 | 0.24 to 0.80 | 22% to 25% | 10.00 wire + 0.40 FX | 52% | 0.40 | 2% + recipient spread (not published); TH is not eligible |
| TH | 50 | 0.30 | 0 | 0.6% | up to 4.50 | 0.60 to 2.00 | 10% to 13% | 10.00 + 1.00 | 22% | 1.00 | as above |
| ID | 20 | 0.12 | 0 | 0.6% | up to 4.20 | 0.24 to 0.80 (path not published) | 22% to 25% | local fee not published + 0.40 FX | not published | 0.40 | 2% + spread (not published) |
| ID | 50 | 0.30 | 0 | 0.6% | up to 4.50 | 0.60 to 2.00 | 10% to 13% | as above | not published | 1.00 | as above |
| PH | 20 | 0.12 | 0 | 0.6% | up to 4.20 | 0.24 to 0.80 | 22% to 25% | local fee not published + 0.40 FX | not published | 0.40 | 2% + spread (not published) |
| PH | 50 | 0.30 | 0 | 0.6% | up to 4.50 | 0.60 to 2.00 | 10% to 13% | as above | not published | 1.00 | as above |
| VN | 20 | 0.12 | 0 | 0.6% | up to 4.20 | 0.24 to 0.80 | 22% to 25% | 10.00 wire + 0.40 FX | 52% | 0.40 | 2% + spread (not published) |
| VN | 50 | 0.30 | 0 | 0.6% | up to 4.50 | 0.60 to 2.00 | 10% to 13% | 10.00 + 1.00 | 22% | 1.00 | as above |
| US | 20 | 0 (ACH) | 0 | 0% | up to 4.20 | 1.50 | 28.5% | 1.00 ACH | 5% | 0.40 | 2% |
| US | 50 | 0 | 0 | 0% | up to 4.50 | 1.50 | 12% | 1.00 | 2% | 1.00 | 2% |
| JP | 20 | 0.08 (FX) | 0 | 0.4% | up to 4.20 | 0.24 to 0.80 | 22% to 25% | 10.00 wire + 0.40 FX | 52% | 0.40 | 2% + spread (not published) |
| JP | 50 | 0.20 | 0 | 0.4% | up to 4.50 | 0.60 to 2.00 | 10% to 13% | 10.00 + 1.00 | 22% | 1.00 | as above |

Reading of the table: on Airwallex local rails a USD 20 payout loses about 12 cents. On Payoneer at published retail rates the same payout loses about USD 4.50 to 5.70, before the USD 29.95 annual fee on the recipient. Trolley is blocked at the sender, and its wire routes for TH, VN and JP would cost half of a USD 20 payout.

## What I could not verify

1. Whether Airwallex Malaysia accepts a sole proprietorship (SSM Form D). The help centre asks for a "fully incorporated" company and lists company documents only. Ask Airwallex MY support before you sign up, or open the application and see which entity types the form offers.
2. Whether Airwallex asks for an extra approval before production Payouts API access. The API-keys page shows self-serve keys and says nothing about approval.
3. The Airwallex FX margin for THB, VND, KRW, IDR and PHP: 0.4% on the pricing page, 0.60% on the fee schedule. The fee schedule is the contract document.
4. Payoneer Mass Payouts pricing, the sender eligibility of a MY sole proprietor, and the payout minimum. The developer portal renders with JavaScript and the fetch tool could not read it.
5. Payoneer withdrawal in local currency for Indonesia and Brunei. Neither is on the same-country list.
6. Trolley per-route minimums. The support article exists but renders with JavaScript.
7. PayPal: whether a Malaysian business account can hold a USD balance to fund USD payouts, and the recipient-side conversion spread per country.
8. Wise: the docs say Malaysian business accounts can fund via the API; the product page says Malaysia has no Business account. The product page is newer in tone but carries no date.
9. Incoming bank fees charged by the recipient's own bank in each country. No provider publishes them.

## Sources

Airwallex
- https://www.airwallex.com/my/pricing (read 2026-09-29)
- https://www.airwallex.com/en-my/terms/fee-schedule (read 2026-09-29)
- https://www.airwallex.com/my/business-account/transfers (read 2026-09-29)
- https://www.airwallex.com/en-my/blog/how-does-airwallex-work-malaysia (read 2026-09-29; a blog page, but it is the provider's own)
- https://help.airwallex.com/hc/en-gb/articles/900001757026-Eligibility-to-open-an-account (read 2026-09-29)
- https://help.airwallex.com/hc/en-gb/articles/4408591334937-Eligible-Countries-and-Territories (read 2026-09-29)
- https://help.airwallex.com/hc/en-gb/articles/4591058176015-Documents-required-for-companies-in-Malaysia (read 2026-09-29)
- https://help.airwallex.com/hc/en-gb/articles/12004460708111-Documents-required-for-companies-in-South-East-Asia (read 2026-09-29)
- https://help.airwallex.com/hc/en-gb/articles/900001756666-What-are-the-limits-for-payouts-and-deposits-on-my-account (read 2026-09-29)
- https://help.airwallex.com/hc/en-gb/articles/900001759663-Is-there-a-minimum-and-maximum-limit-to-the-amount-I-can-convert (read 2026-09-29)
- https://www.airwallex.com/docs/payouts/payout-network/bank-accounts and the country pages `/thailand`, `/malaysia`, `/singapore`, `/united-states`, `/japan`, `/korea-republic-of`, `/indonesia`, `/brunei-darussalam`, `/viet-nam`, `/philippines` (read 2026-09-29)
- https://www.airwallex.com/docs/api (read 2026-09-29)
- https://www.airwallex.com/docs/api/payouts/transfers/create (read 2026-09-29)
- https://www.airwallex.com/docs/payouts/batch-transfers/create-a-batch-transfer (read 2026-09-29)
- https://www.airwallex.com/docs/developer-tools/api/manage-api-keys (read 2026-09-29)
- https://assets.ctfassets.net/e6wv1zvbwa49/5aEO9BxIfdR0in3Pbl6leu/8418c39436f996b5bd032e9282302171/_March_2022__Airwallex_MY_-_Fee_Schedule.docx.pdf (read 2026-09-29; superseded)

Payoneer
- https://www.payoneer.com/pricing/ (read 2026-09-29)
- https://www.payoneer.com/mass-payouts/ (read 2026-09-29)
- https://www.payoneer.com/marketplace/mass-payouts-platform/ (read 2026-09-29)
- https://www.payoneer.com/developers-docs/mass-payout/ (read 2026-09-29)
- https://developer.payoneer.com/docs/mass-payouts-v4.html (read 2026-09-29; body not readable without JavaScript)
- https://partners.sandbox.payoneer.com/Files/APIGuide.pdf (read 2026-09-29; legacy 2016 guide)
- https://www.payoneer.com/resources/business/payoneer-integration-api-marketplace-solutions/ (read 2026-09-29)
- https://www.payoneer.com/resources/how-to-use-payoneer/how-payoneer-calculates-withdrawal-fees/ (read 2026-09-29)
- https://www.payoneer.com/resources/how-open-a-payoneer-account-how-much-does-it-cost/ (read 2026-09-29)
- https://www.payoneer.com/resources/how-to-withdraw-money-from-payoneer/ (read 2026-09-29)
- https://payoneer.custhelp.com/app/answers/detail/a_id/18605/~/withdraw-to-bank---faq (read 2026-09-29)
- https://www.payoneer.com/withdraw-funds/ (read 2026-09-29)

Trolley
- https://trolley.com/trolley-pricing/ (read 2026-09-29)
- https://trolley.com/faqs/ (read 2026-09-29)
- https://trolley.com/platform/global-payout-network/ (read 2026-09-29)
- https://trolley.com/platform/recipient-management/ (read 2026-09-29)
- https://trolley.com/pay/ (read 2026-09-29)
- https://trolley.com/pay/instant-payout-methods/ (read 2026-09-29)
- https://developers.trolley.com/api/ (read 2026-09-29)
- https://support.trolley.com/s/article/Bank-Transfer-Payment-Minimums (read 2026-09-29; body not readable without JavaScript)

PayPal
- https://www.paypal.com/my/webapps/mpp/merchant-fees (read 2026-09-29)
- https://developer.paypal.com/docs/payouts/standard/reference/country-feature/ (read 2026-09-29)
- https://developer.paypal.com/docs/payouts/standard/reference/faq/ (read 2026-09-29)

Wise
- https://wise.com/my/business/ (read 2026-09-29)
- https://wise.com/help/articles/2813542/where-do-i-need-to-live-to-hold-money-with-wise (read 2026-09-29)
- https://docs.wise.com/guides/product/send-money/use-cases/payouts-smbs (read 2026-09-29)
- https://docs.wise.com/guides/developer/auth-and-security/personal-api-token (read 2026-09-29)
