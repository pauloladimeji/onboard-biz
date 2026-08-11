# Access Control (ACL) — Spec

Status: **planning** — no implementation yet. Reflects the decisions from the
Paul / Nonami call (Aug 11), which simplified the earlier draft.

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
| Manage recipients (add / edit) | — | — | ✓ | ✓ |
| Initiate **& complete** payments | — | — | ✓ | ✓ |
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

- **Payments (initiate / complete)** — hidden for Viewer and Developer; unchanged for
  Operator / Admin.
- **Recipients** — add / edit hidden for Viewer and Developer; list stays read-only for
  them.
- **API keys** — screen visible to Operator / Developer / Admin, hidden from Viewer;
  warning shown on generation.
- **Team** — Admin only. Lives as a tab inside **Settings** (which already exists).
  Invite / edit / remove members, assign role.
- **Role visibility** — a small indication of the current user's role (e.g. in the
  profile menu) so people understand why an action is or isn't available.
- **Permission / empty states** — every gated action needs a defined "you can't do
  this" state (a Viewer landing on a list with no create button, etc.).

The one genuinely new path is moving invites in-app — **invite → accept → account
setup** — versus today's back-office step. Worth scoping within the sprint.

## Implementation notes (from the call)

- **Enforcement spans multiple backend services.** Payments (initiate/complete),
  recipients, and team/invites are separate services — each must enforce the ACL.
  Designing the ACL model is ~1–2 days; applying and enforcing it across every
  endpoint/service (and every screen on the frontend) is the bulk of the ~1-sprint
  estimate. Backend and frontend can run in parallel across the sprint.
