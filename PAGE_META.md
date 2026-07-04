# Page Meta Titles & Descriptions

Format: `[Page] — Onboard Business`

## Auth (public pages)

| Route | Meta title | Meta description |
|---|---|---|
| `/sign-in` | `Sign in — Onboard Business` | Sign in to your Onboard Business account to send payments and manage your global USD account. |
| `/apply` | `Apply for access — Onboard Business` | Apply to join Onboard Business. Fund in USD, GBP, EUR, NGN, or stablecoins. Pay out globally. |

## App (authenticated pages)

Meta descriptions not needed — pages are behind a login wall and won't be crawled.

| Route | Meta title |
|---|---|
| `/home` | `Home — Onboard Business` |
| `/deposit` | `Deposit — Onboard Business` |
| `/send` | `Send payment — Onboard Business` |
| `/recipients` | `Recipients — Onboard Business` |
| `/recipients/new` | `Add recipient — Onboard Business` |
| `/transactions` | `Transactions — Onboard Business` |
| `/transactions/:id` | `Transaction details — Onboard Business` |
| `/accounts/:currency` | `[CCY] Account — Onboard Business` (e.g. `USD Account — Onboard Business`) |
| `/cards` | `Cards — Onboard Business` |
| `/cards/:id` | `[Card name] — Onboard Business` (e.g. `Operations card — Onboard Business`) |
| `/settings/profile` | `Profile — Onboard Business` |
| `/settings/security` | `Security — Onboard Business` |

## Notes

- Dynamic titles (`/transactions/:id`, `/cards/:id`, `/accounts/:currency`) should fall back to the generic form while the entity is loading — e.g. `Transaction details — Onboard Business` before the ID resolves.
- `/cards/:id` falls back to `Card details — Onboard Business` if the card name hasn't loaded.
- Use `<meta name="description">` for the two public pages. No OG tags needed unless you later want social sharing previews.
