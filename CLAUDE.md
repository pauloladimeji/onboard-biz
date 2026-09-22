# Onboard Business — Design Prototype

## Start here

**`v1/` is the live prototype.** Open `v1/index.html`; edit the files in `v1/`. `v0/` is design
reference plus the shared data/design-system files v1 loads.

Read in this order:
1. **`v1/HANDOFF.md`** — the engineering handoff, and the real spec: adaptive model, primitives,
   activity taxonomy, per-screen behaviour, open questions for backend.
2. **This file** — orientation, backlog, conventions, standing design decisions.
3. **`ACL-SPEC.md`** — the four roles and what each can do.
4. **[`CHANGELOG.md`](CHANGELOG.md)** — what changed and why, newest first.
5. **`chats/chat1.md`, `chats/chat2.md`** — the original Claude Design transcripts. Historical:
   they describe the `project/` bundle and the retired v0/v1/v2 accounts models, but they're still
   where the *why* behind the early visual decisions lives.

These files are a design medium, not production code — implementation lives in a separate repo.
Match the surrounding style rather than modernising it, and ask before building anything ambiguous.

## Architecture

Two folders. **`v1/` is the live prototype** — that's the one to open and edit. `v0/` is the
earlier desktop-only build, kept as design reference and for the shared files v1 still loads from
it (`v0/data.jsx`, `v0/combobox.jsx`, `v0/design-system/`). The retired `project/` folder is the
original Claude Design bundle.

> **Naming trap:** older notes use "v0 / v1 / v2" for the *accounts model* (USD+stables /
> reference-based / named accounts). That toggle is gone — the backend converts everything to USD,
> so the single-USD-balance model won. Today **v0 and v1 mean the two folders**, nothing else.

No build step — Babel standalone compiles JSX in the browser at runtime. Each file exports its
components on a `window.OBXxx` global (Babel standalone has no modules), so **load order in
`index.html` matters**: `v0/data.jsx` first, `app.jsx` last.

```
v1/
  index.html         entry point (load this); each script has a ?v=N cache-buster — bump on edit
  app.css            all v1 styles; desktop-first with .page-mobile overrides
  primitives.jsx     → OBPrimitives — adaptive building blocks, roles/ACL (CAN, can(), SIGNED_IN)
  auth.jsx           → OBAuth — sign-in, TOTP, forgot/set password, apply-for-access
  shell.jsx          → OBShell — post-login chrome (sidebar+topnav ↔ bottom tabs+topbar)
  dashboard.jsx      → OBDashboard — Home
  letter.jsx         → OBLetter — shared document frame + account letter
  receipt.jsx        → OBReceipt — transaction receipt + txMoney(), the shared money math
  deposit.jsx        → OBDeposit — Deposit + funding rails
  send.jsx           → OBSendPayment — Send payment flow
  recipients.jsx     → OBRecipients — Recipients list + delete
  add-recipient.jsx  → OBAddRecipient — 3-step add-recipient wizard
  transactions.jsx   → OBTransactions — Transactions list + detail
  settings.jsx       → OBSettings — Settings (profile, limits, team, security) + Developer
  cards.jsx          → OBCards — Cards: list, detail, cardholders, limits, fees
  subaccounts.jsx    → OBSubAccounts — EXPLORATORY, hidden by default
  app.jsx            → root: auth state machine, routing, mock-control state, toast
  HANDOFF.md         engineering handoff — the detailed spec for everything above

v0/
  data.jsx           → OBData, OBIcon — mock data + icons, shared with v1
  combobox.jsx       → OBCombobox — searchable dropdown, shared with v1
  design-system/     tokens, Euclid Circular A fonts, flags, logos, card art
  (screens-*.jsx, index.html — the old desktop build, reference only)
```

**`v1/HANDOFF.md` is the detailed spec** — adaptive model, primitives, activity taxonomy, screen
behaviours, open questions for backend. This file is the orientation; that one is the detail.
`ACL-SPEC.md` holds the role matrix.

## How to run locally

```bash
python3 -m http.server 8080 --directory /Users/pauloladimeji/Downloads/dev/onboard-biz
# open http://localhost:8080/v1/
```

Must be served over HTTP — `file://` won't work (script src loading is blocked). Append `?demo=1`
for the public demo build (hides mock controls, adds the demo banner and CTAs).

After editing any file, bump its `?v=N` in `v1/index.html` or the browser serves the cached copy.

## Mock controls panel

Behind the gear icon in the topbar (hidden in demo mode). This is a **design harness, not
settings** — each control stands in for a backend/account state, so ignore it when scoping.

| Group | Controls |
|---|---|
| Auth | Flow · Invite link · Password result · After password · Recovery approval link |
| Account | Data state · Account status · Withdrawal hold (post-recovery) |
| Funding | USD account status · NGN account details · Stablecoin addresses · EUR / GBP account |
| Payments | Send payment order · 2FA on payments · 2FA method · Compliance hold · Name lookup |
| Access | **Role (ACL)** (Viewer / Developer / Operator / Admin) · API access |
| Cards | Not applied · No cards yet · Card, no spend · KYC rejected · Low balance · Active |
| Exploratory | Sub-accounts (Hidden / Business units / Many customers) |

`v1/HANDOFF.md` §8 documents what each one changes.

## Current state

Everything below is built in `v1/` and works on both breakpoints. See `v1/HANDOFF.md` §11 for the
behaviour detail.

- **Auth** — sign-in (password → TOTP), forgot/set password, account recovery, apply-for-access
  (Tally embed). 2FA is TOTP-only; email OTP is retired.
- **Home** — global USD balance, Deposit / Send actions, recent activity, role in the greeting.
- **Deposit** — funding-method picker (tabs desktop / selector mobile): NGN convert-on-deposit,
  USDC/USDT with network picker, and USD/EUR/GBP fiat accounts sharing one provisioning state model
  (not requested → submitting → under review → ready, or declined). Limits per rail, and the
  **account letter** (proof of account details, opens as its own printable document).
- **Send payment** — recipient-first or amount-first; either amount field drives the other
  (send or receive currency); live rate + fee with countdown; reason required, memo optional;
  review, 2FA approval, confirmation.
- **Recipients / Add recipient** — fiat and crypto tabs, search + filter, delete; 3-step wizard
  with rail-specific fields and simulated account-name verification.
- **Transactions** — stats strip, search and filters (direction / status / currency / type), list
  and detail with a type-aware payment-details card, money breakdown, settlement timeline, and
  **printable receipts** for completed transactions.
- **Cards** — list, detail, create / fund / withdraw / freeze / reassign, cardholder per card,
  role-gated actions, per-card spending limits with spend-to-date, fees and terms, and the full
  state set (activating, low balance, rejected, failed, terminated).
- **Settings** — business profile, limits (with request-an-increase), **Team** (invite / role /
  remove, Admin only), security. **Developer** — API keys + webhooks behind 2FA.
- **Global states** — suspended account, compliance hold, KYB gating.
- **Demo mode** (`?demo=1`) — entry gate, banner, guided nudges, conversion CTAs.
- **Sub-accounts** — exploratory sketch, hidden unless the mock toggle is on. Not scoped for build.

### Pending / deferred

Checked against `v1/` on 2026-09-22. The v1 app is the live prototype — `v0/` is retired design
reference, so anything below is scoped against v1. `v1/HANDOFF.md` §13 carries the open questions
for backend; this list is design/build work.

**Built since this list was written** (don't re-scope these): cards, team members / RBAC, API key
management, the empty state for send payment when there are no recipients yet, and entering the
amount in the receiving currency (`SwappableAmountFields` in `send.jsx` — both fields are live and
either one drives the other).

**Stubbed — the control exists but does nothing:**
- Transactions: **Export CSV** button (`transactions.jsx`, toasts "phase 2")
- Transaction detail: **Retry payment** on a failed payment (`transactions.jsx`, toasts "phase 2")

**Not started:**
- Transactions: bulk select, saved filter views, real date-range picker (the filter bar has
  direction / status / currency / type, but no date filter at all)
- Transaction detail: cancel for processing payments, audit trail, linked transactions
- Recipients: bulk CSV import, recipient detail view (history + edit + deactivate) — the row's
  ··· menu goes straight to delete, there's no detail screen
- Audit log (phase 2)
- Variation B — multi-corridor: funding in USD/GBP/EUR/NGN, payouts to African corridors **and**
  hard currency. The whole prototype is Variation A today.

**Dropped as stale** — these were v0-mode tasks and v0 is retired: the compact multi-column layout
on funding account details, locking the send-payment source picker to USD in v0, and connecting
the v0 sign-up flow.

## Key design decisions (don't reverse without checking the changelog or chats)

- **Mono font removed** — references/account numbers use `tabular-nums`, not monospace
- **No "Quick actions" card** on Home — the sidebar CTA covers it
- **No "Switch business"** in the topnav, **no in-app notification bell**
- **Reason for payment**: required in the send flow. **Memo**: optional
- **Settlement time**: not on the amount card, only on the review page
- **Rate display**: subtle pulse dot + "Rate refreshes in Xs" countdown, not a noisy section
- **KYB rejected**: no "Restart KYB" button — contact compliance instead
- **Account details**: tabs per rail, not a list of stacked cards
- **Deposit rail order**: NGN → USDC → USDT → USD → EUR → GBP (local and stablecoin rails lead;
  they're instant and self-serve, the fiat accounts need partner provisioning)
- **2FA is TOTP-only** — email OTP is retired, in the prototype and in the backend
- **Role display**: in the Home greeting chip, not standing chrome in the header
- **Failed cards**: no retry, no terminate — the backend supports neither
- **Reassigning a card doesn't unfreeze it** — the previous holder may have the card details
- **Cross-border card fee, not "FX"** — it applies to non-US merchants even when they bill in USD

## Code style

- Babel standalone JSX, no TypeScript, no bundler, no npm
- `const { useState, useEffect } = React` at the top of each file; no hooks library
- Adaptive layout via `useIsDesktop()` and the primitives in `primitives.jsx` (`Page`, `Sheet`,
  `Pill`, `FilterBar`, `Records`…) — don't hand-roll a second modal or table
- Icons are inline SVG via `const Icon = window.OBIcon` (defined in `v0/data.jsx`)
- Design tokens as CSS variables (`var(--gray-900)`, `var(--info-700)`…); classes for repeated
  patterns, inline styles for one-offs
- Comments explain **why**, never what — most code here needs none
- Every file ends with its `window.OBXxx = { … }` export
- **Bump `?v=N` in `v1/index.html`** for every file you touch, or the browser serves a stale copy
- Role checks go through `can(role, action)` from `primitives.jsx`, never an inline role comparison

## Business context

**Onboard is pivoting B2B.** Two archetypes:
- **Variation A** (what's built): Africa-focused payouts. Fund in USD. Pay out to NGN/GHS/KES/MZN/TZS.
- **Variation B** (not built): multi-corridor. Fund in USD/GBP/EUR/NGN, pay out to African corridors
  *and* hard currency.

**The single-USD-balance decision.** The backend converts every deposit to USD — there are no
per-currency balances. So the app shows one USD balance, with NGN and stablecoins as funding rails
and EUR/GBP as fiat accounts that convert on arrival. The old "reference-based" and "named
accounts" models (v1/v2 in the early chats) were dropped; don't reintroduce them.

Implementation lives in a separate repo (`~/Downloads/dev/onboard-biz-app/`), which points back at
this prototype for visual intent.
