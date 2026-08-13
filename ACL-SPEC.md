# Access Control (ACL) — Spec

Status: **planning** — no implementation yet; prototyped in `v1/` for review. Reflects the
decisions from the Paul / Nonami call (Aug 11), plus what the prototype settled (marked below).

## Goal

Move team-member access off "everyone the back office adds gets full access" onto a
small set of roles, scoped to what the app actually does today. Deliberately minimal —
no per-account scoping, no approval engine.

Prioritised ahead of NGN withdrawals: it's a known quantity, and it's a prerequisite
before letting businesses move large volume through the app.

## Scope

**In scope**
- Four fixed roles: Viewer, Developer, Operator, Admin
- Applied against the business's **single main account**
- Admins manage the team (invite / edit / remove, assign roles)

**Explicitly out of scope (deferred, by decision)**
- **Payment approval / maker-checker** — deferred until bulk approval exists (see
  Payments below). Operators complete their own payments for now.
- **Subaccount-scoped access** — the product businesses use today doesn't involve
  subaccounts (they're a separate API-built primitive). Revisit only when subaccounts
  are exposed in the app; at that point a member↔account permission layer can sit on
  top of these roles.
- **Scoped API keys** — keys grant full access; a warning is shown instead of building
  per-key scopes.
- Self-approval blocking, per-currency scoping, audit log, custom roles.

## Roles

| | Viewer | Developer | Operator | Admin |
|---|:---:|:---:|:---:|:---:|
| View transactions / accounts | ✓ | ✓ | ✓ | ✓ |
| Recipients (view **and** manage) | — | — | ✓ | ✓ |
| Initiate **& complete** payments | — | — | ✓ | ✓ |
| Open a new currency account | — | — | ✓ | ✓ |
| Generate / manage API keys | — | ✓ | ✓ | ✓ |
| Manage team (invite / edit / remove) | — | — | — | ✓ |

- **Viewer** — read-only. Sees transactions and accounts, nothing else. Cannot see or
  generate API keys.
- **Developer** — Viewer + API keys. The seat an Admin (e.g. a non-technical CEO) hands
  to a CTO / hired dev who needs key access but no money-movement or team power.
- **Operator** — day-to-day money ops: manage recipients, initiate **and complete**
  payments, and generate API keys.
- **Admin** — everything an Operator/Developer can do, plus manage the team. The
  superset.

> **Changed from v2 — recipients.** The earlier draft kept the recipients *list* readable for
> Viewer and Developer and hid only add/edit. Dropped: transactions already carry the
> counterparty on every row and in the detail view, so a read-only directory only adds payees
> who've never been paid — not worth a gated screen, and it hands anyone on a Viewer seat the
> full supplier book. Reverting is one line if compliance or finance wants the list back.

> **Deposit was not covered by v2.** Resolved as: viewing account details (numbers, fees,
> limits) is open to every role, since it's read-only and it's how a Viewer reconciles. Opening
> a *new* currency account — the NGN/stablecoin generate step and the EUR/GBP/USD request step —
> is Operator/Admin.

## Payments — no approval split (v1)

Operators **initiate and complete their own payments** — the same flow as today,
protected by the existing 2FA step. There is no separate approver, no pending queue, no
completion handoff.

Why the earlier maker-checker split was dropped:
- It's a big change to the payment flow.
- There's **no bulk approval** yet — approving transactions one-by-one is the wrong UX.
  Finance teams want to approve in bulk.

So: ship the simple model first and add approvals incrementally. When approval returns
it should be **bulk approval**, not per-transaction — that's the trigger for
reintroducing an approver distinction.

## API keys

Keys are **not scoped** — an API key grants full programmatic access to the account,
which bypasses the UI roles entirely. Rather than build per-key scopes (complex, rarely
done), show a clear warning at generation, e.g.:

> This API key gives complete programmatic access to your account.

Key generation is available to **Operator, Developer, and Admin**; hidden from Viewer.
Because keys are tied to the member who created them, key activity can still be traced
back to a user.

## UI surface

**No net-new flows.** ACL is conditional rendering / hiding of existing screens by role,
not new screens.

Three rules, applied in this order:

1. **Nav → hide.** A role that can't reach a screen isn't shown a door to it. Send,
   Recipients and Developer disappear from the sidebar / bottom tabs accordingly.
2. **Route → guard state.** Back button, bookmark or stale link into a hidden route lands
   on a "you don't have access to X" panel, never a blank screen.
3. **Action inside a reachable screen → hide the button.** Disabled-with-tooltip invites
   hover-hunting for a permission the user can't grant themselves. Where the button's
   absence would read as a bug rather than a restriction, replace it with one grey line
   ("Only operators and admins can open new accounts").

- **Payments** — hidden for Viewer and Developer, including the dashboard CTA.
- **Recipients** — screen hidden entirely for Viewer and Developer (see above).
- **Deposit** — details readable by all; provisioning actions Operator/Admin.
- **API keys** — visible to Operator / Developer / Admin, hidden from Viewer;
  warning shown on generation.
- **Team** — Admin only, a section inside **Settings**. Invite / edit role / remove /
  resend. Two guards belong in the UI as well as the API, or the error only surfaces
  after the click: **you can't act on your own row**, and **the last active admin can't
  be demoted or removed**.
- **Granting a money-capable role** — selecting Developer or Admin in the invite or
  change-role sheet shows an inline warning. Developer is the non-obvious one: they can't
  send a payment in the UI at all, but an unscoped key moves money, so the seat is much
  heavier than "read-only plus keys".
- **Role visibility** — a read-only row in Settings › Business profile, next to name and
  email. Deliberately *not* a persistent chip in the header: it's a check-once fact, not
  standing chrome.

### Invites

The one genuinely new path — in-app, versus today's back-office step.

- **Admin sets first name, last name, email and role.** The invitee gets no profile step;
  they set a password, then 2FA, then land on Home. Nothing else is editable by them.
- **Invite lifetime is the backend's** — currently 3 days. The frontend must read it off
  the invite and render it, never hardcode a number, or the copy drifts the day it's tuned.
- **Resend** is available on any pending or dead invite from the Team list. It's the only
  fix for a dead invite, since the invitee has no account to authenticate a self-serve one.
- **One dead-invite state**, whatever killed it — expired, withdrawn, or already accepted.
  Same screen, same exits (sign in, or ask an admin). Distinguishing them would let anyone
  holding a stale link probe whether an address already has an account.

## Implementation notes (from the call)

- **Enforcement spans multiple backend services.** Payments (initiate/complete),
  recipients, and team/invites are separate services — each must enforce the ACL.
  Designing the ACL model is ~1–2 days; applying and enforcing it across every
  endpoint/service (and every screen on the frontend) is the bulk of the ~1-sprint
  estimate. Backend and frontend can run in parallel across the sprint.
