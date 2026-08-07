# Onboard Business — v1 (Adaptive) · Engineering Handoff

This document describes the **v1 adaptive prototype** for engineering implementation. It is
**one codebase that feels native on mobile and scales up to the desktop layout**, rather than
two separate builds.

**v1 is the single canonical reference — for both desktop and mobile.** `v0/` is fully retired —
every screen it had is now in v1, adaptive. Nothing in v0 needs to be opened to build against v1;
see §13 for the handful of v0 screens that were deliberately *not* ported (reference-only, dead
paths, not gaps). When v0 and v1 disagree, **v1 wins.**

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
above. Don't build new work into it.

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
cards.jsx          → window.OBCards — Flex Business Cards: list, detail, create/fund/withdraw/freeze
subaccounts.jsx    → window.OBSubAccounts — EXPLORATORY, hidden by default (see §11)
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
| **Stablecoin network picker** | Chip row (`.chan-picker`) | Plain dropdown (`.net-select`) — deliberately lighter than the currency selector (no card/avatar/search); a real backend can list ~10 networks, too many to lay out as wrapping chips |
| **2-column detail grids** | 2-col | Stacked |
| **Auth shell** | Split two-column (form + marketing panel) | Single centered column, no marketing panel |
| **Card detail layout** | Two-column (`.card-detail-grid`: fixed 360px card + actions / flexible transactions) | Stacked, card visual full-width on top |
| **Card number/exp/CVV reveal** | Hover shows a "Click to reveal/copy" tooltip, then click reveals/copies | No hover (no touch equivalent) — tap reveals, tap again copies, confirmed by the existing toast; no tooltip |
| **Card "More" actions** | Anchored dropdown (Spending limits / Withdraw / Fees / Edit / Delete) | Same list, opened as a `Sheet` |

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
| `ErrorPanel` | Error-code → friendly-copy lookup (generic fallback for unmapped codes) wrapped in a `StatusPanel`. See §11 Deposit for the seed registry entry and where it's used. |
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
  generic ("Your Account Manager · Here for your business") — intentionally **not** tied to a named
  person so it doesn't go stale.

The Shell only wraps the **post-login app** (`flow === "app"` in `app.jsx`). The auth screens in §7
render before it exists, with their own shell.

---

## 7. Auth (`auth.jsx`) — pre-login flow

Covers the **active real sign-in flow**, plus the **Apply-for-access** entry point for users with
no account yet. The KYB application itself is Tally's hosted form — `ApplyForAccessScreen` embeds
it via iframe (§ table below) so the applicant never leaves the app; Tally owns the form logic and
hosting, not the surrounding UI. What's excluded is v0's *older*, superseded sign-up screens — see
§13 for what and why.

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
| **USD account status** | Whitelist + provisioning state: not whitelisted / not requested / submitting / under review / ready / declined / error |
| **NGN account details** | Whether the NGN virtual account is provisioned (not generated / ready) |
| **Stablecoin addresses** | Whether USDC/USDT deposit addresses are provisioned |
| **EUR / GBP account** | Provisioning state: not requested / submitting / under review / ready / declined / error |
| **Account-request error message** | Which error the error-registry demo shows: a known code (UBO KYC) vs an unmapped one (generic fallback) |
| **Send payment order** | Default step order: recipient-first vs amount-first |
| **2FA on payments** | Whether the payment-approval step is required |
| **2FA method** | Default approval method: authenticator (TOTP) vs email OTP |
| **Compliance hold** | Injects a held transaction + amber banner |
| **Name lookup** (Add Recipient only) | Forces the account-name verification path on/off |
| **API access** | Developer API entitlement: granted / pending / not requested |
| **Cards** | Whether the business has applied for Flex Business Cards: not applied (shows `CardsApplyPage`) vs active |
| **Sub-accounts (exploratory)** | Hidden / Business units / Many customers. Hidden by default — adds/removes the nav item and swaps the whole layout + fixtures. Not a shipped feature; see §11 |

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
- **Crypto counterparty addresses** (the "from"/"to" on the blockchain block) are fabricated —
  this account's own side reuses the real deposit addresses already shown on the Deposit screen,
  but the external counterparty address is a plausible placeholder, not a real one.

---

## 10. Activity taxonomy (ledger's Account Activity API)

The real backend is moving Transactions off a flat transactions endpoint onto an aggregated,
typed **Account Activity** feed — 7 activity types in the real API. **Only 5 are in scope for
the web app right now**; internal transfers and offramp deposits are deferred (nuanced,
multi-leg/hybrid shapes not needed for this launch) — don't build UI for those two.

| Activity type | Fixture shape (`activityData`) | Where it shows up |
|---|---|---|
| `ACCOUNT_NUMBER_DEPOSIT` | `senderAccountDetails` (name/number/bank), `channel`, `fee`, `settlementAmount`, `settlementAssetCode`, `settlementExchangeRate` | Payment details: Sender / "Sender bank / platform" (bank + masked account combined into one row) / Channel |
| `CASH_DEPOSIT` | `payinCurrency`, `payinAmount`, `providerReference` | Payment details: Provider reference row |
| `CASH_PAYMENT` | `payoutCurrency`, `payoutAmount`, `providerReference`, `channel`, `recipient` (name/bank/country) | Payment details: Beneficiary / Beneficiary bank / Channel rows |
| `CRYPTO_DEPOSIT` | `feeAmount`, `feeInclusive`, `blockchainInfo` (network, txHash, senderAddress, recipientAddress, tokenSymbol) | Payment details: Network / From / To / Tx hash rows; `feeAmount` drives Money breakdown |
| `CRYPTO_WITHDRAWAL` | same as above, sender/recipient roles flipped | Payment details: Network / From / To / Tx hash rows; `feeAmount` drives Money breakdown |

**`channel`** (on `ACCOUNT_NUMBER_DEPOSIT` and `CASH_PAYMENT`) names the actual rail — Domestic
wire (Fedwire), ACH, Faster Payments, SEPA, SWIFT, NIBSS Instant Payment, GhIPSS, Pesalink, TIPS,
RTGS Mozambique, or Stablecoin transfer — mirroring the ledger's `CashAccountDetails.accountInfoType`
discriminator (`CashLocalBankAccount`/`CashACHBankAccount`/`CashSepaBankAccount`/
`CashSwiftBankAccount`/`CashMobileWalletAccount`/`CashMultiRailBankAccount`) for deposits and
`BasicBeneficiaryInfo.paymentChannelId` for payouts. **"Sender bank / platform" is deliberately not
"Sender bank"** — it also needs to read naturally for non-bank senders (Payoneer, Upwork, etc.).
Two SWIFT samples exist for exactly this reason: `FND-2026-00323` (inbound, international wire in)
and `PAY-2026-04815` (outbound, same-currency international wire out) — the latter also previews
the hard-currency payout direction "Variation B" would need (see business context in the root
`CLAUDE.md`).

**Payout channel is derived from the recipient, not the currency alone** — `RECIPIENTS_FULL`
already tags each recipient `Bank` or `Mobile money`; mobile-money recipients get their actual
network (`M-Pesa`, `Vodafone Cash`, `Airtel Money`, `OPay`, etc., parsed from the recipient's
`handle`), everyone else falls back to the currency's bank rail (`PAYOUT_RAILS`). Don't
regress this to a pure currency→channel lookup — a Vodafone Cash payout doesn't travel over
GhIPSS, and 5 of the 19 `CASH_PAYMENT` fixtures are mobile-money recipients.

**Known remaining gap:** no deposit fixture uses a mobile-wallet inbound channel
(`CashMobileWalletAccount` in the ledger spec) or the generic `CashMultiRailBankAccount` — funding
via mobile money is less central to this launch, so it wasn't worth a dedicated sample, but flag it
if the real inflow mix turns out to need it.

**One "Payment details" card for every type, not a type-specific card swap.** It always shows
Reference/Type/Initiated, plus whichever extra rows the active type adds (sender/beneficiary
details for the 3 fiat types, network/addresses/hash for the 2 crypto types). **Money breakdown**
(the second card) is likewise one component for every type — crypto's `feeAmount` (mirrors the
ledger's `AccountTransaction.feeAmount`/`feeInclusive`) feeds the exact same amount-minus-fee
arithmetic as the fiat types, just labelled "Network fee" instead of "Onboard fee" and in the
token unit instead of a fiat currency. There's no separate "blockchain details" card — don't
reintroduce one.

**`ACCOUNT_NUMBER_DEPOSIT` is deliberately the dominant deposit type in the fixtures** (7 of 8
deposit rows, spanning USD/GBP/EUR/NGN) — a dedicated account number per currency (USD Wire/ACH,
GBP FPS, EUR SEPA, NGN NUBAN) is what the app actually supports today. `CASH_DEPOSIT` gets a
single, deliberately minority NGN sample (`FND-2026-00322`) — it previews the future **one-time
accounts (OTA)** model (no persistent account, reconciled by reference) that NGN, and eventually
other currencies, are expected to move to. Don't read `CASH_DEPOSIT` as "the normal NGN flow" —
`ACCOUNT_NUMBER_DEPOSIT` is.

`ACTIVITY_TYPE_LABELS` (`../v0/data.jsx`, exported on `window.OBData`) maps each type to its
display label. Every `TXNS`/`TXNS_FULL` fixture is annotated with `activityType` + `activityData`
by a `deriveActivity()` pass at the bottom of `data.jsx` — the raw fixture rows themselves keep
their original loose fields (`chain`, `txHash`, `from`, etc.) untouched, since `v0`'s own (frozen)
screens still read those directly; `activityType`/`activityData` are additive, not a replacement
of the old shape.

**`ACCOUNT_NUMBER_DEPOSIT` and `CASH_DEPOSIT` are deliberately *not* visually distinguished** in
the Transactions list subtitle, the **Type** filter, or the detail screen's `<h1>` — all three read
"Cash deposit" for both. This is `displayActivityType()`/`displayActivityLabel()` in `data.jsx` — a
small `ACTIVITY_DISPLAY_GROUP` map collapses `ACCOUNT_NUMBER_DEPOSIT` onto `CASH_DEPOSIT`'s label
wherever a screen calls `displayActivityLabel(tx.activityType)` instead of indexing
`ACTIVITY_TYPE_LABELS` directly. **Only those three surfaces use it.**

The detail screen's **"Type" row stays precise on purpose** — it's the one place that still says
"Deposit via account number" vs "Cash deposit" outright, indexing `ACTIVITY_TYPE_LABELS` directly
rather than going through `displayActivityLabel`. Don't collapse that row too. The **Channel** row
(`NIBSS Instant Payment` / `SWIFT` / `One-time account (OTA)` / etc.) adds a second, even more
specific layer below it. If a future activity type needs the title/list/filter treatment, add it
to `ACTIVITY_DISPLAY_GROUP` rather than hand-rolling another collapse — but leave the "Type" row
alone.

Status also gained a 4th value: **`PENDING`** (neutral pill tone) — distinct from `PROCESSING`.
`PENDING` means queued/not-yet-started (the `CASH_DEPOSIT`/OTA sample above is awaiting its
reference match); `PROCESSING` means actively in flight.

---

## 11. Screens (status + key behaviours)

All the below are built.

- **Auth** — see §7.
- **Home** — Global USD balance hero, Deposit / Send actions, Recent activity (`Records`). Mobile rows
  show a small pulsing amber dot for *processing* and a red X badge for *failed*.
- **Deposit** — Adaptive funding-method picker (**tabs desktop / currency selector mobile**). Rails:
  NGN (convert-on-deposit), USDC/USDT (network picker + deposit address + decorative QR), USD/EUR/GBP
  (unified fiat-account provisioning — see below). Suspended-account state.
  - **Fiat account provisioning (USD, EUR, GBP) — one shared pattern (`FiatAccountPanel`).** All
    three are realistically partner-review processes, not instant provisioning, so all three share
    one state model: **not requested → submitting (brief, a real API call that can fail fast) →
    under review (1–3 business days, static icon + `TimingChip` — deliberately **not** a spinner,
    since nothing is actively happening moment-to-moment) → ready**, or **declined** after review.
    The "if we need anything else" line is anchored specifically to the **under-review** state (not
    shown pre-submission, where it'd be unclear what "anything else" even refers to) — it means
    anything needed *during* the partner's review, and says we reach out to the business's
    **registered email**, never a link to the banking partner's own site (there isn't one; USD
    previously modeled an "Open verification" external-redirect step that doesn't reflect how this
    actually works, and has been removed).
    - Every non-terminal-success state gives a way to reach a human, not just information: **under
      review** has a "Taking longer than expected? Message us on WhatsApp" link alongside the
      timing chip; **not whitelisted** and **declined** are each a real WhatsApp CTA button, not
      just an inline mention.
    - **USD additionally gates on a whitelist**, checked before any request can even be made. Not
      whitelisted → no request flow at all, just an info panel ("USD accounts are invite-only right
      now") with a "Request access on WhatsApp" CTA — no form, no submitted-state, nothing to track.
    - **EUR/GBP** are dedicated receiving accounts via the *same* endpoint as the USD virtual
      account (`POST`/`GET /accounts/{accountId}/account-details` → `CashDepositPaymentDetails`).
      GBP returns a `CashLocalBankAccount` (account number + sort code = `bankCode`); EUR returns a
      `CashSepaBankAccount` (IBAN = `accountNumber`, optional `bic`). Real allocation can run
      **longer than a minute** — ClearJunction can hand back an IBAN that's still pending approval,
      and since that IBAN is what's used for withdrawals, the "ready" gate must be an explicit
      approval status from the backend, not "details exist." (Exact status field TBC with Eno —
      flagged, not invented here.) EUR/GBP can be **declined** too, same as USD — not a
      USD-exclusive outcome.
    - Funds still credit the single **USD** balance at the live rate on receipt — no per-currency
      balances (confirmed product decision).
    - Mock toggles (§8): *USD account status* (not whitelisted / not requested / submitting / under
      review / ready / declined / error) and *EUR / GBP account* (not requested / submitting /
      under review / ready / declined / error) jump straight to any state; "Send request" runs the
      submitting→under_review transition live.
    - Displayed detail fields are intentionally richer than the bare schema (bank name/address,
      account type, both IBAN and sort code for GBP) — kept deliberately, not an oversight.
      **Fees/limits shown are placeholders** pending real specs from the ledger team.
  - **Error-message registry (`ErrorPanel`, in `primitives.jsx`).** A small error-code → friendly
    copy lookup with a generic "Something went wrong" fallback for anything unmapped, used by the
    fiat-account error state (mock toggle: *Account-request error message*). Meant to grow — add an
    entry whenever a new backend error code turns up, rather than hardcoding a one-off message per
    screen. **Every** error — known code or fallback — gets the same two actions: **Try again** +
    **Message us on WhatsApp**, never a dead end. Registry copy is deliberately generic, not
    diagnostic: the seed entry (`UBO_KYC_INCOMPLETE`) mirrors a real staging error
    (`"KYC record for UBO ... has no personal data or date of birth"`), but that internal specific
    (which record, which field) is a back-office concern — the business-facing copy just says
    something needs verifying and that we'll follow up by email, not the raw reason. Worth noting
    that specific error is also more likely to surface during KYC review via the Tally-embedded
    flow (a back-office concern) than something this screen would naturally hit — the registry
    pattern is general-purpose, this was just the seed example.
- **Send payment** — Recipient-first or amount-first (mock toggle); FX send/receive fields with live
  rate + countdown + over-balance guard; required reason + optional memo; review; 2FA approval
  (authenticator / email, method-switch Sheet); confirmation. Empty (no recipients) + suspended states.
- **Recipients** — Fiat / crypto tabs, search + currency filter; list rows reveal Pay/⋯ on hover
  (desktop) or show an always-visible ⋯ (mobile, since touch has no hover); delete via confirm Sheet.
- **Add recipient** — 3-step wizard (Destination → Details → Review) via `FlowShell`; cash vs crypto;
  currency/method/network pickers (`Combobox`); simulated account-name verification states.
- **Transactions** — Stats strip, search + filters (including a **Type** filter), list
  (table/cards); detail screen with sender/receiver hero, settlement timeline (payouts), a
  type-aware Payment details card (network/addresses/hash rows for crypto, sender/beneficiary rows
  for fiat), a Money breakdown card that works for all 5 types, and actions. See §10.
- **Settings** — Business profile + Security sections (section rail). **Developer** — API keys +
  webhooks, every sensitive action gated behind a 2FA Sheet; not-granted / pending states.
- **Cards** (Flex Business Cards) — card list (horizontal-scroll tiles + all-cards transaction
  list), card detail (two-column desktop / stacked mobile via `.card-detail-grid`), create/fund/
  withdraw/freeze flows, spending limits, fee schedule, and a not-applied landing page — all 7
  modals are `Sheet`-based. See §4 for the touch-adapted card visual (reveal/copy) and §6 for
  where Cards sits in navigation.
- **Sub-accounts — EXPLORATORY, not a shipped feature.** Hidden entirely unless the *Sub-accounts
  (exploratory)* mock toggle (§8) is switched on, which adds the nav item (desktop sidebar inline,
  mobile "More" sheet). Built for customer/prospect conversations, **not** scoped for build — treat
  it as a sketch in the prototype rather than a spec.
  - Modelled on the ledger spec + public docs: sub-accounts are **always USD** (the only supported
    account currency for both main and sub); funded by **internal transfer from the main account**,
    since USD/EUR/GBP account numbers are **main-account only** — NGN is the one currency whose
    account numbers can sit on a sub-account, and crypto funding addresses are per-sub-account too.
    They can **pay out directly in every supported corridor** (`CreateCashPaymentRequest.accountId`
    accepts a sub-account ID), can be **frozen**, and can only be **closed at zero balance**.
  - `reference` is a **client-supplied unique key** (6–36 chars, `^[a-zA-Z0-9_-]{6,36}$`) — the
    mapping key back to the business's own customer or cost-centre ID. It's surfaced as the
    secondary identifier throughout, and auto-slugged from the name on create.
  - **Two modes, because the two use cases want genuinely different UIs** — and different
    *placement*, which is the more interesting finding:
    - **Business units** (a handful of departments/budgets): browse-first. Card grid with avatars
      and an **allocation bar** showing how the balance is split. Also renders a compact
      **section on Home** (`SubAccountsHomeSection`) — for a few units this belongs where the
      balance already is, not behind its own nav item.
    - **Many customers** (thousands, API-created): search-first. Metric row (count / active /
      total held), search over name + reference, dense rows, "showing N of 4,812". No Home
      section — you can't put thousands of anything on a dashboard.
  - Screens: list (per mode above), detail (balance, move money, freeze, close, funding explainer,
    activity feed via `Records`), plus create/move/freeze/close `Sheet`s.
  - **Fixtures are local to `subaccounts.jsx`**, deliberately — nothing in `v0/` needs them, so
    the shared `v0/data.jsx` stays untouched.
  - `INTERNAL_TRANSFER` is the activity type sub-accounts generate most, and it's the one type
    deliberately deferred from the taxonomy work (§10) — it would need to come back if this is
    ever built for real.

---

## 12. Implementation guidance

- **Don't fork the layouts.** The desktop/mobile split is presentational — one state model, two
  renderings behind a breakpoint check. Mirror that: shared logic/state, adaptive view layer.
- **The breakpoint is one constant (768px)** in one hook. Keep it single-sourced.
- **Overlays are one component** (`Sheet`) that becomes a modal or bottom sheet by breakpoint — not
  two implementations. Same for filters, lists, and the stepper.
- **Native `<select>` was deliberately avoided inside bottom sheets** (its popup mispositions in a
  fixed sheet); mobile filters use tappable pills instead. Worth preserving.
- **Wallet/deposit addresses are middle-truncated, never wrapped** (`truncateMiddle`, a shared
  primitive — keeps the start and end, elides a chunk from the middle; full value is in the
  `title` tooltip and always copyable in full). This is a real display convention, not a prototype
  stub — reproduce it wherever a raw address/hash is shown, on both breakpoints.
- **Tokens & type** come from the design system (`colors_and_type.css`) — use those variables, not
  the literal hexes scattered for prototype speed.

---

## 13. Not yet in v1 (known gaps)

**No open gaps.** Cards was the last one — it's now built and adaptive (§11). `v0/` is fully
retired; nothing there needs to be opened to build against v1.

The demo-mode build (§14) added one real, structural fix: recipients (add/delete) now persist in
React state for the session (`app.jsx`) — previously `RECIPIENTS_FULL` was read directly by
`RecipientsScreen`/`SendPayment` and any add/delete was a silent no-op. Not demo-specific; it was
a pre-existing gap the demo surfaced.

**Deliberately excluded — not a gap, don't port these:**

- `ExpressInterestScreen` + `SignUpConfirmationScreen` in `v0/screens-onboarding.jsx` — an earlier,
  bespoke multi-field sign-up form. It's been **superseded by the Tally iframe embed** now used in
  `ApplyForAccessScreen` (§7), so it's dead UI, not an alternate path to support.
- `SignInStatusScreen` + `OtpScreen` (email OTP) in the same file — a legacy post-email status gate
  and email-based 2FA, both superseded by the direct password → TOTP-only flow (2FA is TOTP-only in
  the real backend).

All four exist in v0 only as design-review reference.

- **`INTERNAL_TRANSFER` and `OFFRAMP_DEPOSIT` activity types** (§10) — real types in the ledger's
  Account Activity API, but not part of this web app launch and have no UI anywhere (not even in
  v0). Both have real nuance (paired-leg linking via `groupId`, the offramp's crypto-in/bank-out
  hybrid) that wasn't worth designing until there's an actual need — don't add UI for them without
  a fresh design pass first.

---

## 14. Demo mode — public lead-gen build

v1 doubles as a public, unauthenticated demo. No env var / build flag exists (no bundler), so it's
a **runtime check** in `primitives.jsx`:

```js
function isDemoMode() {
  // true if ?demo=1 is in the URL, or the hostname starts with "demo."
}
```

Everything demo-specific reads this at render time — there's no separate build output. Locally,
append `?demo=1` to the URL to preview it (e.g. `index.html?demo=1`). Turn it off by dropping the
param; there's nothing to "undo".

**What changes in demo mode:**

- **Mock-controls gear is hidden** (`shell.jsx`, `TopBar`/`TopBarMobile`) — the QA harness must
  never be exposed publicly. The Sheet it opens is also suppressed even if somehow triggered.
- **`DemoBanner`** (`shell.jsx`) — persistent top strip ("You're exploring the Onboard Business
  demo…") with an "Open an account" link. Non-dismissible by design; a visitor should always have
  a way back to real signup, not just on first load. Desktop's shell grid gains an extra row
  (`.has-demo-banner`, `--demo-banner-h`) to fit it above the normal topbar.
- **`DemoEntryScreen`** (`app.jsx`) — the only screen a demo visitor sees before the app. Not part
  of the real auth state machine; gated by its own `demoEntryDone` state (`useState(() =>
  !isDemoMode())`, so non-demo builds skip it entirely and every existing `flow` branch is
  untouched). Offers **"For my business"** (enters the demo app) or **"For personal use"** (links
  to the real consumer apps via `CONSUMER_APP_LINKS.ios`/`.android`, no further demo access).
- **`DemoCta`** (`primitives.jsx`) — small reusable prompt ("Ready to do this for real? → Open an
  account"), renders `null` outside demo mode. Dropped into completion moments: `SendConfirmation`
  (`send.jsx`) after a payment, and a new "done" step in `CreateCardSheet` (`cards.jsx` — the sheet
  previously closed straight back to the list on confirm; it now shows a brief success step first
  so there's a place to attach the CTA).
- **`GuidedNudges`** (`shell.jsx`) — Mercury-style floating checklist ("Try the demo": see the
  account, deposit, send, add a recipient, create a card). Tracks visited routes in its own state
  (resets on reload, same as recipients — no persistence needed for a single browsing session),
  collapses to a small progress-ring FAB, and can be hidden for the visit. Rendered inside `Shell`
  on both breakpoints, positioned to clear the bottom tab bar on mobile.

**Conversion tracking convention:** every outbound CTA (banner, entry-gate, `DemoCta`, nudges
panel) wraps its href in `withDemoUtm(url, { utm_campaign: "…" })` (`primitives.jsx`). No analytics
SDK is wired up yet — this only tags links so Google Analytics (or similar) can be dropped in later
to see who's converting, without touching every CTA again. `TALLY_URL` (real signup) and
`CONSUMER_APP_LINKS` (consumer app store links) are the two destinations; both live in
`primitives.jsx` so every screen points at the same URLs rather than a local copy each could drift
from.

**Not built / deliberately out of scope:** real analytics integration (UTM params are the prep
work, not the integration), a public deployment/hosting config for the `demo.` hostname, and any
persona beyond the binary Personal/Business split at entry.
