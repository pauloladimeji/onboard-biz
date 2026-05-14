# Dev Guide — Driving the Prototype

This prototype is a single HTML file (`Onboard Business - Onboarding & Accounts.html`) backed by JSX modules and a CSS bundle. State is mocked; everything you need to demo a scenario is exposed via the **Mock Controls** panel in the bottom-left.

---

## Mock Controls Panel

A floating panel surfaces every demo lever. It opens collapsed by default — click the chevron to expand.

### Flow
Switches between top-level surfaces:
| Option | What you see |
|---|---|
| **Sign-up** | Email/password → verify email → land on Accounts (KYB not submitted). |
| **Sign-in** | Email/password → MFA code → land on Accounts. |
| **App** | Drops you straight into the authenticated app. |

### Accounts model
| Option | What changes |
|---|---|
| **v1 · Reference** | Currency detail pages use the shared-account-with-reference model. |
| **v2 · Named** | Currency detail pages use the dedicated-account-per-currency model. |

### KYB status
Drives the gating across the app:
| Option | Effect |
|---|---|
| **not submitted** | Locked Accounts dashboard with "Start KYB" CTA. Currency tiles are dimmed and unclickable. |
| **in review** | Banner: "Verification in progress." Same locked tiles. |
| **approved** | Full app unlocked. |
| **rejected** | Error state with "Restart KYB" CTA. |

### Data state
| Option | Effect |
|---|---|
| **Populated** | Default fixtures — 3 active accounts, 1 pending (CAD), 8+ transactions, full recipient list. |
| **Empty (new user)** | Zeroed out — no balances, no transactions, empty recipient list. Dedicated empty-state copy on each surface. |

### MFA method (when present)
Sets the default OTP screen the user lands on inside the Send Payment flow. From the screen itself, the user can switch via "Use a different method".

---

## Driving common scenarios

| Scenario | Settings |
|---|---|
| New user, just signed up, hasn't submitted KYB | Flow: App · KYB: not submitted · Data: Empty |
| KYB in review, waiting | Flow: App · KYB: in review · Data: Empty |
| Established business, full activity | Flow: App · KYB: approved · Data: Populated |
| Just opened a new currency account | Flow: App · KYB: approved · Data: Populated → click the **CAD** pending tile |
| Adding a new currency end-to-end | Click the dashed **Add currency** tile → pick a currency → confirm |
| Sending a payment with email OTP | Open Send Payment → on OTP screen tap **Use a different method** → Email |
| Verifying empty states | Data: Empty → walk Accounts, Recipients, Transactions tabs |
| Comparing account models | Toggle Accounts model · v1 / v2 → open any currency detail page |

---

## File map

```
Onboard Business - Onboarding & Accounts.html   ← entry point
data.jsx                                         ← all mocks: currencies, accounts, txns, recipients, rails
screens-accounts.jsx                             ← dashboard, currency detail, add currency modal
screens-payments.jsx                             ← send payment flow + OTP
screens-recipients-and-tx.jsx                    ← recipients + transactions tables/details
screens-settings.jsx                             ← business profile + security
app.css, app-extras.css                          ← styles
```

---

## Editing mocks

`data.jsx` is the single source of truth for demo data:
- `CURRENCIES` — currency metadata (symbol, flag, name, country).
- `ACCOUNTS_A` — funding accounts on the dashboard. Each entry has `status: "active" | "pending" | "not_created"`.
- `TXNS` / `TXNS_FULL` — recent activity and the full transaction list.
- `RECIPIENTS_FULL` — recipient list.
- `RAILS_REF` / `RAILS_NAMED` — inbound rail details for each currency, in both account models.
- `BUSINESS_PROFILE` — settings page content.
- `PAYOUT_RAILS` — outbound rail options used by Send Payment.

Add a new currency to the dashboard by appending to `ACCOUNTS_A`; add a new currency to the **Add currency** modal by editing `ADD_CCY_OPTIONS` near the bottom of `screens-accounts.jsx`.

---

## Notes

- No real backend — `claude.complete` is not used; everything is local.
- Flags in the Add Currency modal load from `flagcdn.com`; everywhere else they come from `design-system/assets/flags/`.
- The prototype is sized to fit a desktop viewport (1280+ recommended).
