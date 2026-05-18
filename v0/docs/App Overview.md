# Onboard Business — App Overview

A multi-currency business banking prototype: businesses sign up, get verified (KYB), receive funds across multiple currencies via dedicated funding accounts, manage recipients, and send international payouts.

---

## Surfaces

### 1. Sign-up & Sign-in
- Email + password, business name, country.
- Email verification step (6-digit code).
- Sign-in supports the same MFA pattern used elsewhere in the app.

### 2. KYB (Know Your Business)
Four states drive what the app shows:
- **Not submitted** — empty Accounts dashboard with a "Start KYB" prompt and locked currency tiles.
- **In review** — same dashboard, but with a "Verification in progress" banner.
- **Approved** — full app unlocked.
- **Rejected** — error state with restart option.

### 3. Accounts Dashboard
The home of the app. Shows:
- **Total balance** (USD-equivalent, FX-converted).
- **Currency tiles** — one per opened currency (USD, GBP, EUR by default), each showing balance + supported rails. Tiles are clickable.
- **Add currency** tile — opens a modal listing additional currencies (CAD, AUD, JPY, CHF, SGD, HKD, AED, ZAR). Picking one shows a confirmation step, then a "provisioning" state.
- **Pending account state** — a tile showing "Opening in progress" while a newly-added currency is being provisioned, with a dedicated detail page reflecting the same.
- **Recent activity** — last 8 transactions across all currencies.

### 4. Currency Detail Page
Per-currency view with two product variations toggleable from the mock panel:
- **v1 · Reference-based** — a single shared account number with a unique payment reference per customer.
- **v2 · Named accounts** — a dedicated account number per currency.

Both show: balance, inbound rails (with copyable account details), and currency-scoped recent activity.

### 5. Send Payment
Multi-step flow:
1. Pick a recipient (or add a new one inline).
2. Pick the source currency account.
3. Enter amount — live FX conversion shown.
4. Add purpose / reference.
5. Review.
6. **OTP approval** — authenticator app by default; user can switch to email code via a "Use a different method" sheet.
7. Success — "Payment on its way" with expected settlement, receipt destination, and links to track or send another.

### 6. Recipients
- List view with search + currency filter.
- Add recipient flow (multi-step: name → currency + rails → account details → review).
- Recipient detail page with payment history and edit/delete actions.

### 7. Transactions
- Filterable list (status, direction, date, currency).
- Per-transaction detail page showing full audit trail and rail-level metadata.
- Empty state when no activity exists.

### 8. Settings
Read-only mirror of the verified KYB profile, plus security:
- **Business profile** — legal name, registration, address, directors, beneficial owners. Changes go through a "Request a change" support flow.
- **Security** — authenticator setup/revoke, password change, login history.

---

## Scope notes
- Designed against the existing Onboard design system (typography, spacing, color scales).
- All data is mocked — see the dev doc for how to drive states.
- Variation A (3 funding currencies, African payout corridors) is the primary scope; named-accounts variation is a toggleable alternative model.
