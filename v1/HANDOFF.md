# Onboard Business — v1 (Adaptive) · Engineering Handoff

This document describes the **v1 adaptive prototype** for engineering implementation. It is
**one codebase that feels native on mobile and scales up to the desktop layout**, rather than
two separate builds.

**v1 is the single canonical reference — for both desktop and mobile.** `v0/` is frozen/legacy;
read it only for the one thing not yet ported to v1 (see §12). This resolves the "two references"
problem — when v0 and v1 disagree, **v1 wins.**

> ⚠️ **This is a design prototype, not production code.** It runs React + Babel-standalone in the
> browser (no build step) purely so design can iterate. Treat it as the **spec for behaviour and
> layout**, not as code to lift. Re-implement in the real stack.

---

## 1. How to run

Served over HTTP from the **repo root** (it references `../v0/` via relative paths):

```bash
cd onboard-biz            # repo root, NOT v1/
python3 -m http.server 8080
# open http://localhost:8080/v1/index.html
```

Resize the window across **768px** to see the layout flip between desktop and mobile.

---

## 2. What shares with v0

v1 does **not** duplicate data or design tokens — it loads them from `v0/` by relative path
(see `v1/index.html`):

| Shared from v0 | Purpose |
|---|---|
| `../v0/data.jsx` | All mock data + icon set (`window.OBData`, `window.OBIcon`, `window.OBNetworkIcon`) |
| `../v0/combobox.jsx` | Searchable dropdown (`window.OBCombobox`) — used in Add Recipient + Deposit selector |
| `../v0/design-system/` | Design tokens (`colors_and_type.css`), Euclid Circular A fonts, flag SVGs, logo |

Everything else is v1-owned. `v0/` is otherwise **frozen** — kept only to serve the shared files
above and the not-yet-ported screen in §12. Don't build new work into it.

---

## 3. File structure (`v1/`)

Load order matters (globals, no modules) — see `index.html`:

```
index.html         entry point; loads v0 shared files, then v1 files, app.jsx last
app.css            all v1 styles (imports ../v0 tokens); desktop-first with .page-mobile overrides
primitives.jsx     → window.OBPrimitives — adaptive building blocks (see §5)
auth.jsx           → window.OBAuth — sign-in, TOTP, forgot/set password, apply-for-access (see §7)
shell.jsx          → window.OBShell — the post-login adaptive Shell (sidebar/topnav ↔ bottom-tabs/topbar)
dashboard.jsx      → window.OBDashboard — Home
deposit.jsx        → window.OBDeposit — Deposit + funding rails
send.jsx           → window.OBSendPayment — Send Payment flow
recipients.jsx     → window.OBRecipients — Recipients list + delete
add-recipient.jsx  → window.OBAddRecipient — 3-step add-recipient wizard
transactions.jsx   → window.OBTransactions — Transactions list + detail
settings.jsx       → window.OBSettings — Settings + Developer
app.jsx            → root App: auth flow state machine, post-login routing, mock-control state, toast
```

Cache-busting: each `<script>`/`<link>` in `index.html` has a `?v=N` query. Bump it when a file
changes (this is a dev convenience, irrelevant to real implementation).

---

## 4. The adaptive model

**Single breakpoint: 768px.** A `useIsDesktop(breakpoint = 768)` hook (`primitives.jsx`) wraps
`window.matchMedia('(min-width: 768px)')` and re-renders on change. Components branch on it.
CSS mirrors it two ways: the `Page` primitive adds a `page-mobile` class below 768px (most
overrides hang off `.page-mobile …`), and a couple of legacy blocks use `@media (max-width: …)`.

At the breakpoint, these concerns flip:

| Concern | Desktop (≥768) | Mobile (<768) |
|---|---|---|
| **Navigation** | Left sidebar + top bar | Bottom tab bar (5 items + More) + top bar |
| **Overflow nav** | Sidebar "Workspace" group (Settings, Developer) + Cards inline | "More" tab → bottom Sheet |
| **Overlays** | Centered modal | Bottom sheet (drag handle) |
| **Tables** | `<table>` | Stacked card rows |
| **List filters** | Inline dropdowns | Filter icon → Sheet of tappable pills |
| **Multi-step progress** | Vertical step sidebar | Horizontal dot bar + current-step label |
| **Deposit method picker** | Tab strip | Currency selector (dropdown) |
| **2-column detail grids** | 2-col | Stacked |
| **Auth shell** | Split two-column (form + marketing panel) | Single centered column, no marketing panel |

> **Implementation note:** the same route/selection state drives both layouts, so a user rotating
> a tablet or a responsive breakpoint change never loses context. Build the shared state once; the
> two renderings are presentational.

---

## 5. Adaptive primitives (`primitives.jsx`, `window.OBPrimitives`)

These are the reusable pieces. Where behaviour differs by breakpoint it's called out.

| Primitive | What it does |
|---|---|
| `useIsDesktop(bp=768)` | Boolean hook, matchMedia-backed. The single source of the breakpoint. |
| `Page` | Page wrapper; adds `page-mobile` class < 768px (drives most CSS overrides). |
| `Shell` | The post-login app frame — see §6. |
| `Sheet` | **Adaptive overlay**: centered modal on desktop, bottom sheet (with drag handle) on mobile. Same API. Used for: More nav, mock controls, list filters, delete-recipient confirm, 2FA method picker, create/revoke API key, TOTP verify. |
| `Records` | **Adaptive list**: `<table>` on desktop, card rows on mobile. Powers the dashboard's Recent activity. (Transactions has its own table/card renderers built on the same classes.) |
| `FilterBar` | **Adaptive filters**: search + inline dropdowns on desktop; search + a filter icon (badge = active count) opening a Sheet of tappable pills on mobile. Driven by a `filters` array. |
| `FlowShell` | **Adaptive stepper**: vertical numbered step list on desktop, compact horizontal dot bar + current-step label on mobile. Used by Send Payment + Add Recipient. |
| `FieldGrid` | Key/value detail grid: 2-col desktop, stacked mobile. |
| `FeeGrid` | Fee/timeline cards: 3-col desktop, stacked mobile. |
| `RailTabs` | Horizontally scrollable tab strip (desktop Deposit picker). |
| `Banner` | Inline notice (info/warn/danger/success/neutral). Title-less variant centers its icon. |
| `StatusPanel` | Centered icon + title + copy block (empty / apply / waiting states). |
| `Pill` | Status pill (success/warn/danger/info/neutral). |
| `TimingChip` | Small clock-labelled chip (fast/med/slow). |
| `CopyInline` / copy buttons | Copy-to-clipboard affordances. |
| `CcyFlag` (by currency) / `Flag` (by raw country code) | Flag renderers — **two distinct lookups, don't conflate**: `CcyFlag` keys off `CURRENCIES[code].flag`, `Flag` takes a raw code like `"ng"`. |
| `QrCode` | **Decorative** QR (deterministic pattern seeded by the value). Used by the stablecoin deposit address and the TOTP setup screen. See §9. |
| `Toast` | Ephemeral confirmation: bottom-right on desktop, above the tab bar on mobile. |
| `shortRef` | Truncates long references to 22 chars + ellipsis (full value in `title`/copy). |

---

## 6. The Shell (`shell.jsx`) — post-login chrome

- **Desktop:** CSS-grid frame — top bar (logo, mock-controls gear, avatar) across the top; left
  sidebar with primary nav (Home, Deposit, Send, Recipients, Transactions), **Cards** inline, then a
  **"Workspace"** group (Settings, Developer); an **account-team card** (WhatsApp support entry point)
  pinned to the sidebar bottom.
- **Mobile:** sticky top bar (logo, gear, WhatsApp icon, avatar) + a fixed **bottom tab bar**: the 5
  primary items plus a **"More"** tab that opens a Sheet containing Cards / Settings / Developer.
- **Account team / WhatsApp** is a support-relationship entry point (`wa.me` deep link), copy is
  generic ("Your account manager · Here for your business") — intentionally **not** tied to a named
  person so it doesn't go stale.

The Shell only wraps the **post-login app** (`flow === "app"` in `app.jsx`). The auth screens in §7
render before it exists, with their own shell.

---

## 7. Auth (`auth.jsx`) — pre-login flow

Covers the **active real sign-in flow**, plus the **Apply-for-access** entry point for users with
no account yet. The KYB application itself is Tally's hosted form — `ApplyForAccessScreen` embeds
it via iframe (§ table below) so the applicant never leaves the app; Tally owns the form logic and
hosting, not the surrounding UI. What's excluded is v0's *older*, superseded sign-up screens — see
§12 for what and why.

**Screens** (`window.OBAuth`):

| Screen | Behaviour |
|---|---|
| `SignInScreen` | Email entry. |
| `SignInPasswordScreen` | Password entry; shows an inline error + reset link on the "wrong password" mock state; links to Forgot password and Apply for access. |
| `ForgotPasswordScreen` | Request a reset link → "check your email" confirmation state. |
| `TotpVerifyScreen` | Returning user — 6-digit code entry. |
| `TotpSetupScreen` | First sign-in — QR code + manual key + 6-digit verify. The QR uses the `QrCode` primitive (decorative, not scannable). |
| `ApplyForAccessScreen` | Info page for users with no account; "Start your application" opens the real Tally KYB form in an iframe (full-screen overlay on mobile, left panel of the split shell on desktop). |
| `SetPasswordScreen` | Magic-link landing page (password + confirm) — reached via an email link in the real app. |

**Shell:** its own `AuthShell` (local to `auth.jsx`, not a shared primitive) — desktop renders a
split two-column layout (form left, marketing panel right); mobile drops the marketing panel and
centers the form in a single column. See the "Auth shell" row in §4.

**Routing:** `app.jsx` holds a top-level `flow` state — `signin | signin-password |
forgot-password | signin-totp-verify | signin-totp-setup | signin-set-password |
apply-for-access | app` — and returns the matching auth screen before the Shell/post-login routing
ever runs. Successful TOTP verification (or setup) sets `flow` to `"app"`.

**Mock controls during auth:** since there's no Shell yet, mock controls open from a small floating
gear (top-right) instead of the top-bar one — see §8.

---

## 8. Mock controls — this is a design harness, NOT settings

`app.jsx` renders a **`MockControls`** panel, opened from the **gear icon in the top bar** post-login
(both breakpoints), or from the **floating gear** pre-login (§7) — always as a Sheet.
**These are prototype toggles for design/QA to preview different states — they are NOT user-facing
settings and must NOT be implemented as a feature.** The real settings live under the **Settings**
nav item.

Each toggle just flips prototype state so a reviewer can see a given screen variant. Reference:

| Mock control | Flips… (real-world equivalent) |
|---|---|
| **Flow** | Jumps between Sign-in, App, Apply-for-access, and the set-password landing page |
| **Password result** | Simulates the password check: correct vs wrong |
| **After password** | Which TOTP screen follows a correct password: first-time setup (QR) vs returning (code entry) |
| **Data state** | Populated vs empty-account (zero balances / empty states) |
| **Account status** | Active vs suspended (global suspended banner, disabled actions) |
| **USD account status** | KYB/onboarding state of the USD bank rail: not applied / incomplete / under review / approved / declined |
| **NGN account details** | Whether the NGN virtual account is provisioned (not generated / ready) |
| **Stablecoin addresses** | Whether USDC/USDT deposit addresses are provisioned |
| **EUR / GBP deposits** | Whether those rails are live (available) or waitlisted |
| **Send payment order** | Default step order: recipient-first vs amount-first |
| **2FA on payments** | Whether the payment-approval step is required |
| **2FA method** | Default approval method: authenticator (TOTP) vs email OTP |
| **Compliance hold** | Injects a held transaction + amber banner |
| **Name lookup** (Add Recipient only) | Forces the account-name verification path on/off |
| **API access** | Developer API entitlement: granted / pending / not requested |

> **For eng:** ignore this panel entirely when scoping. It corresponds to **backend/account and
> auth states** your real system already owns, surfaced here only so design could demo each branch
> without a backend. The screens themselves are the spec.

---

## 9. What is intentionally mocked/faked

So nobody mistakes a stub for intended behaviour:

- **QR codes** (stablecoin deposit, TOTP setup) are **decorative** — a deterministic pattern per
  value, not a real encoding. Swap in a real QR encoder at implementation; the layout/sizing stays
  the same.
- **2FA / OTP inputs** accept `123456` or any 6 digits ending in an even digit — placeholder logic.
- **References**: funding uses `OPN-{uuid}` format, payouts use `PAY-YYYY-NNNNN` (matches live app).
  `shortRef` truncates them in dense UI; full value is always copyable.
- **Stubbed actions** (toast only, no real behaviour): Download PDF / receipt, Export CSV, Retry
  payment, "phase 2" toasts.
- **All amounts, addresses, bank details, API keys** are fixtures from `../v0/data.jsx`.

---

## 10. Screens (status + key behaviours)

All the below are built. (Cards is **not** in v1 — see §12.)

- **Auth** — see §7.
- **Home** — Global USD balance hero, Deposit / Send actions, Recent activity (`Records`). Mobile rows
  show a small pulsing amber dot for *processing* and a red X badge for *failed*.
- **Deposit** — Adaptive funding-method picker (**tabs desktop / currency selector mobile**). Rails:
  NGN (convert-on-deposit), USDC/USDT (network picker + deposit address + decorative QR), USD (bank
  application flow with not-applied → submitting → verify → under review / approved / declined), EUR/GBP
  (convert-on-deposit *or* waitlist per the mock toggle). Suspended-account state.
- **Send payment** — Recipient-first or amount-first (mock toggle); FX send/receive fields with live
  rate + countdown + over-balance guard; required reason + optional memo; review; 2FA approval
  (authenticator / email, method-switch Sheet); confirmation. Empty (no recipients) + suspended states.
- **Recipients** — Fiat / crypto tabs, search + currency filter; list rows reveal Pay/⋯ on hover
  (desktop) or show an always-visible ⋯ (mobile, since touch has no hover); delete via confirm Sheet.
- **Add recipient** — 3-step wizard (Destination → Details → Review) via `FlowShell`; cash vs crypto;
  currency/method/network pickers (`Combobox`); simulated account-name verification states.
- **Transactions** — Stats strip, search + filters, list (table/cards); detail screen with
  sender/receiver hero, settlement timeline (payouts), money breakdown, actions.
- **Settings** — Business profile + Security sections (section rail). **Developer** — API keys +
  webhooks, every sensitive action gated behind a 2FA Sheet; not-granted / pending states.

---

## 11. Implementation guidance

- **Don't fork the layouts.** The desktop/mobile split is presentational — one state model, two
  renderings behind a breakpoint check. Mirror that: shared logic/state, adaptive view layer.
- **The breakpoint is one constant (768px)** in one hook. Keep it single-sourced.
- **Overlays are one component** (`Sheet`) that becomes a modal or bottom sheet by breakpoint — not
  two implementations. Same for filters, lists, and the stepper.
- **Native `<select>` was deliberately avoided inside bottom sheets** (its popup mispositions in a
  fixed sheet); mobile filters use tappable pills instead. Worth preserving.
- **Tokens & type** come from the design system (`colors_and_type.css`) — use those variables, not
  the literal hexes scattered for prototype speed.

---

## 12. Not yet in v1 (known gaps)

**Gap — still needs building:**

- **Cards** — intentionally removed from v1 nav (deferred). A full desktop-only version exists in
  `../v0/screens-cards.jsx` if it's picked up later; it has no adaptive/mobile design yet. This is
  the **only** reason to open `v0/` today.

**Deliberately excluded — not a gap, don't port these:**

- `ExpressInterestScreen` + `SignUpConfirmationScreen` in `v0/screens-onboarding.jsx` — an earlier,
  bespoke multi-field sign-up form. It's been **superseded by the Tally iframe embed** now used in
  `ApplyForAccessScreen` (§7), so it's dead UI, not an alternate path to support.
- `SignInStatusScreen` + `OtpScreen` (email OTP) in the same file — a legacy post-email status gate
  and email-based 2FA, both superseded by the direct password → TOTP-only flow (2FA is TOTP-only in
  the real backend).

All four exist in v0 only as design-review reference.

When Cards is ported into v1, v0 can be fully retired.
