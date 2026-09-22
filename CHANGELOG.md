# Changelog — Onboard Business Prototype

Changes made via Claude Code sessions after the initial Claude Design handoff.

---

## 2026-09-22

### Team card assignment
- Every card now has a **cardholder** — any active team member, picked in Create card (defaults to the creator) and shown on card tiles, card detail and the card transaction sheet. Replaces the hardcoded placeholder name.
- Admins and operators can reassign a card (Change on the cardholder row, or More → Change cardholder). Number, balance, limits and history stay with the card.
- New `cards` permission in the ACL table: **admin/operator** manage every card (create, fund, withdraw, rename, reassign, limits, unfreeze, terminate); **viewer/developer** see only cards they hold and can use + freeze them, not unfreeze, fund or change them. A holder with no cards gets a "No cards assigned to you" panel instead of the create-first-card state.
- Removing a team member freezes the live cards they hold. The remove sheet in Settings → Team says how many; the card shows a "Cardholder removed" panel with Reassign / Terminate. Reassigning deliberately does **not** unfreeze — the previous holder may have saved the card details, so unfreezing stays a separate step.
- Team roster moved from `settings.jsx` into `v0/data.jsx` (shared by Settings and Cards); cards derive holder-removed state from the roster rather than storing it.
- **Files changed**: `v0/data.jsx`, `v1/primitives.jsx`, `v1/settings.jsx`, `v1/cards.jsx`, `v1/app.jsx`, `v1/app.css`, `ACL-SPEC.md`

### Spending controls
- Limits (per transaction / daily / monthly) can now be set **when creating a card** — collapsed summary line with an "Adjust" link — and edited later by admins and operators. Others see them read-only.
- Limits are **sliders** capped at a configured maximum per limit (`LIMIT_MAX` in `cards.jsx` — placeholder values pending the real ones). Moving one limit past its neighbour carries the neighbour with it, so per transaction ≤ daily ≤ monthly always holds and there's no error state.
- Setting a limit below what's already been spent in that period warns that payments will be declined until it resets.
- **Spend vs limits**: compact panel below the cardholder details on card detail (spent this month + bar, with today and the per-payment cap beneath), and full daily/monthly bars with amount left and reset timing in the limits sheet. Amber at 75%, red at 90%, "Limit reached" at 100%.
- Card fixtures carry a `spent` figure (today / month); Travel & expenses sits at 88% to show the amber state.
- **Files changed**: `v0/data.jsx`, `v1/cards.jsx`, `v1/app.css`

---

## 2026-09-21

### Transaction receipts
- New `receipt.jsx` — a receipt document for any completed payment or deposit, opened in its own tab with "Download as PDF". One template for every rail; fiat and crypto differ only in which rows exist.
- Money math moved into a shared `txMoney(tx)` used by both the receipt and the transaction detail page, so a receipt can't show different numbers from the screen it was opened from.
- References are consistent everywhere: Onboard reference + **Network reference** (value or "N/A"; crypto shows the tx hash linked to the explorer). Rail subtitles and the MT103 note were dropped.
- Receipt buttons only appear on **completed** transactions; the email-receipt action only on outgoing completed ones.
- **Files changed**: `v1/receipt.jsx` (new), `v1/transactions.jsx`, `v1/app.css`, `v1/index.html`

### Deposit fees in fixtures
- Deposit transactions were all showing a zero fee (hardcoded). They now carry the real fee per rail (Fedwire, ACH, SWIFT, FPS, SEPA, NGN free) and the credited amount is net of it.
- Removed the conversion-fee row from the app — it isn't charged.
- **Files changed**: `v0/data.jsx`, `v1/transactions.jsx`

### Shared document frame
- `letter.jsx` now exports a `DocFrame` + `openDocument(id, title)` used by both the account letter and the receipt, so everything we issue shares one letterhead, watermark and legal footer.
- **Files changed**: `v1/letter.jsx`

### Card fees, terms and pricing
- "Fees and terms" sheet: card creation $5, funding 1%, monthly free, USD transactions free (US merchants, in USD), **cross-border 1.75% + $1** (non-US merchants, or any non-USD currency), chargeback $50 — plus the terms that surprise people after the fact (minimum balance, repeated declines, termination).
- Cross-border rather than "FX": the provider charges it on non-US merchants even when they bill in USD.
- Removed "works anywhere / worldwide" claims; Apple Pay / Google Pay buttons replaced with a "coming soon" line rather than disabled controls.
- Failed cards no longer offer Retry or Terminate — the backend supports neither.
- **Files changed**: `v1/cards.jsx`, `v1/app.css`

---

## 2026-09-16 → 09-18

### Account letter
- New `letter.jsx` — "Proof of account details", the document businesses currently get made by hand in Slack. Opens in its own tab, prints to PDF, set in Arial with the spiral watermark and the legal footer on every page.
- USD splits domestic and international instructions into separate blocks; EUR and GBP each get a single block.
- Footer carries a CTA to open an Onboard account.
- **Files changed**: `v1/letter.jsx` (new), `v1/deposit.jsx`, `v1/app.css`

### Card states
- Empty state redesign, KYC-rejected and no-transactions states, low-balance (below the $1 minimum → frozen until funded), failed and terminated cards.
- "Hide failed and terminated cards" toggle on the list, remembered in `localStorage` — a dead card is clutter every visit, not just once.
- Brand name settled as **Business Classic**.
- **Files changed**: `v1/cards.jsx`, `v1/app.css`, `v0/data.jsx`

### Role display
- The signed-in member's role shows in the dashboard greeting chip ("Welcome back, Jide" + role name). Clicking it scrolls to and flashes the "Your role" row in Settings.
- Earlier attempts (a persistent header tag, an avatar menu) were removed — a role is a check-once fact, not standing chrome.
- **Files changed**: `v1/dashboard.jsx`, `v1/settings.jsx`, `v1/shell.jsx`, `v1/primitives.jsx`

---

## 2026-08-11 → 08-18

### Access control (ACL)
- Four fixed roles — Viewer, Developer, Operator, Admin — implemented against a `CAN` table in `primitives.jsx` with a `can(role, action)` helper, plus a "Role (ACL)" mock control to switch seats live. Spec lives in `ACL-SPEC.md`.
- **Team** section in Settings: invite (first/last name, email, role), resend, change role, remove. Two guards live in the UI as well as the API — you can't act on your own row, and the last active admin can't be demoted or removed.
- Invites expire after 3 days; expired and revoked invites read the same way.
- Granting Developer or Admin shows an inline warning — a developer can't send a payment in the UI, but an unscoped API key moves money.
- API keys reworked off the back of Nonami's feedback: no required IP allowlist, no role cap on key scope.
- **Files changed**: `ACL-SPEC.md`, `v1/primitives.jsx`, `v1/settings.jsx`, `v1/shell.jsx`, `v1/app.jsx`, `v1/auth.jsx`, `v1/deposit.jsx`, `v1/dashboard.jsx`

### Limits
- Settings → Limits: USD-first with the local amount in brackets; withdrawal limits ($50k per transaction, $100k per day); "Request an increase" sheet that hands off to WhatsApp.
- Deposit page shows the same limits, with a "See all limits" link back to Settings.
- GBP FPS shows a fee **range** plus a note about the cross-scheme case.
- **Files changed**: `v1/settings.jsx`, `v1/deposit.jsx`, `v1/app.css`

---

## 2026-07-23

### Meta & Open Graph tags for the public demo
- Added `<meta name="description">`, Open Graph, and Twitter Card tags to the two public entry points (`v1/index.html` — the Vercel root — and `v0/index.html`) so the demo shows a proper title, description, and preview image when shared (Slack, LinkedIn, iMessage, X, etc.)
- Absolute URLs point at the public host `https://demo.business.onboard.xyz`; added `theme-color` and `canonical` too
- Renamed the `v1/index.html` browser-tab `<title>` from the internal `"Onboard Business — v1 (Adaptive)"` to the public-facing `"Onboard Business — Live Product Demo"` (this is the Vercel root, so the title shows publicly; matches the "Live Product Demo" eyebrow on the entry page)
- New `v0/design-system/assets/og-image.png` (2400×1260, 2× of 1200×630): the shared preview image the tags reference — recreates the demo entry hero (photo, floating card, headline, feature list, lime accent)
- **Files changed**: `v1/index.html`, `v0/index.html`, `v0/design-system/assets/og-image.png` (new)

---

## 2026-05-18

### Auth layout toggle (two-column variant)
- Added mock control "Auth layout" with "Full screen" and "Two column" options
- "Full screen" = existing centered card layout
- "Two column" = split layout — form on white left panel, dark right panel with tagline + license stamps
- Right panel currently shows: tagline ("The modern way to move money.") + FinCEN/VASP/SEC/CBN badges at the bottom
- Right panel background is a dark gradient placeholder — team will supply a background image to drop in via `.auth-split-right` CSS
- Layout prop flows through all auth screens: SignUp, SignIn, OTP, RegisterBusiness, TotpSetup
- Responsive: right panel hides below 900px
- **Files changed**: `screens-onboarding.jsx`, `app.jsx`, `app.css`

### Network icons (stablecoin chains)
- Added brand-colored SVG icons for Ethereum, Base, Polygon, Solana, Tron
- Icons appear in the network selector buttons on the USD currency detail page (stablecoin tabs)
- Icons appear inline in the "Network" row on transaction detail for stablecoin deposits
- New global: `window.OBNetworkIcon` (exported from `data.jsx`)
- **Files changed**: `data.jsx`, `screens-accounts.jsx`, `screens-recipients-and-tx.jsx`

### FX rate pulse dot alignment
- Fixed vertical alignment of the green pulse dot next to FX rate text
- Was sitting on the text baseline; now vertically centered with `vertical-align: middle` + slight upward nudge
- **Files changed**: `app.css`

### Deployment prep
- Renamed entry HTML to `index.html` (was "Onboard Business - Onboarding & Accounts.html") for clean Vercel URLs
- Deployed on Vercel with root directory set to `v0`

---

## 2026-05-16

### v0 folder creation + v1/v2 strip-down
Created a standalone `v0/` folder from the original `project/` directory, stripped of all v1 (reference-based) and v2 (named accounts) code. v0 is the current architecture: single USD balance, stablecoins as funding rails.

**What was removed:**
- `accountsMode` state and mock panel toggle (v0/v1/v2 selector)
- `CurrencyDetailRefBased` component (v1 — shared depository with unique reference per business)
- `CurrencyDetailNamedAccounts` component (v2 — dedicated named accounts per currency)
- `RailNamedPanel` component (v2 rail detail panels)
- `AddCurrencyModal` and `ADD_CCY_OPTIONS` (v1/v2 — add GBP/EUR/CAD accounts)
- `RAILS_REF` data constant (v1 reference-based rail data)
- `ACCOUNTS_A` data constant (v1/v2 multi-currency account list)
- GBP and EUR entries from `RAILS_NAMED` (renamed to `FIAT_RAILS`, USD-only)
- Dead code: `QuickAction`, `MonthRow` components

**What was kept/simplified:**
- `CurrencyDetailPage` — single component handling v0 USD detail (stablecoin tabs first, fiat tabs gated by issuance state)
- `AccountsDashboard` — hardcoded to v0 behaviour (single USD tile, waitlist currencies)
- `FIAT_RAILS` — flat array with USD Wire/ACH/SWIFT rails only
- All mock controls except accounts model toggle

**Files changed**: `data.jsx`, `screens-accounts.jsx`, `app.jsx`, `app.css`

### Auth screens update (project/ folder)
- Refactored `AuthShell` in the original `project/` folder — extracted stepper into reusable component
- Updated HTML entry point script references
- **Files changed**: `project/screens-onboarding.jsx`, `project/app.css`, `project/app.jsx`, `project/index.html`

---

## Pre-handoff (Claude Design + first Claude Code session)

See `chats/chat1.md` and `chats/chat2.md` for the full design history. Summary of what was built is in `CLAUDE.md` under "Current state".
