# Changelog — Onboard Business Prototype

Changes made via Claude Code sessions after the initial Claude Design handoff.

---

## 2026-07-23

### Meta & Open Graph tags for the public demo
- Added `<meta name="description">`, Open Graph, and Twitter Card tags to the two public entry points (`v1/index.html` — the Vercel root — and `v0/index.html`) so the demo shows a proper title, description, and preview image when shared (Slack, LinkedIn, iMessage, X, etc.)
- Absolute URLs point at the public host `https://demo.business.onboard.xyz`; added `theme-color` and `canonical` too
- Renamed the `v1/index.html` browser-tab `<title>` from the internal `"Onboard Business — v1 (Adaptive)"` to the public-facing `"Onboard Business — Business payments, without the friction"` (this is the Vercel root, so the title shows publicly)
- New `v1/og-preview.html`: a 1200×630 social-image source that recreates the demo entry hero (photo, floating card, headline, feature list, lime accent) — screenshot it to regenerate the OG image; capture instructions are in the file header
- New `v0/design-system/assets/og-image.png` (2400×1260, 2× of 1200×630): the shared preview image the tags reference. Placeholder rendered from `og-preview.html` — replace with a fresh screenshot anytime
- **Files changed**: `v1/index.html`, `v0/index.html`, `v1/og-preview.html` (new), `v0/design-system/assets/og-image.png` (new)

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
