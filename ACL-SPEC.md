# Access Control (ACL) — Spec

Status: **planning** — no implementation yet. This captures the agreed model so we
can react to it before any code or mock work.

## Goal

Move team-member access off "everyone the back office adds gets full access" onto a
small set of roles, scoped to what the app actually does today. Deliberately minimal —
no configurable policy engine, no permission builder.

## Scope

**In scope**
- Three fixed roles: Admin, Operator, Viewer
- One per-Operator flag: whether they can *complete* (release) payments
- Admins manage the team (invite / remove / assign roles)

**Explicitly out of scope (deferred, by decision)**
- Configurable approval policy (thresholds, on/off per amount)
- Self-approval blocking / four-eyes enforcement
- Admin resetting another member's 2FA
- Per-currency or per-account scoping
- Audit log (wanted eventually; not part of this cut)
- Custom / user-defined roles

## Roles

| | Viewer | Operator | Admin |
|---|:---:|:---:|:---:|
| View accounts / transactions | ✓ | ✓ | ✓ |
| Manage recipients (add / edit) | — | ✓ | ✓ |
| Initiate a payment | — | ✓ | ✓ |
| **Complete a payment** | — | only if flag on | ✓ (default) |
| Manage team (invite / remove / assign roles) | — | — | ✓ |

- **Viewer** — read-only. Accountants, auditors, anyone who needs visibility but should
  move no money.
- **Operator** — day-to-day payments work. Can prepare payments and manage recipients.
  Whether they can *release* a payment is governed by the completion flag below.
- **Admin** — everything an Operator can do, plus completes payments by default and
  manages the team.

## The completion flag

A single boolean on each Operator: **can complete payments**.

- **Flag off** — the Operator prepares a payment and submits it. It lands in a
  **pending** state and is not sent. An Admin (or a completion-enabled Operator)
  releases it.
- **Flag on** — the Operator sends directly, same as an Admin.

Admins always have completion rights; the flag does not apply to them.

There is intentionally **no self-approval block**: a completion-enabled Operator can
complete a payment they initiated. Turning that block on is the switch we'd flip if we
ever want true four-eyes — not now.

## Payment states

The only data change this model needs: a payment carries a `status` that supports a
pending-completion step.

```
draft → pending_completion → completed
                           ↘ cancelled
```

- An initiate action by anyone with completion rights goes straight toward `completed`
  (through the existing 2FA step).
- An initiate action by an Operator without the flag stops at `pending_completion`.
- Completing a `pending_completion` payment requires completion rights.

Carrying this state now — even if nothing sets `pending_completion` until the flag
ships — is what lets a real approval queue slot in later without a refactor.

## Where the gates surface in existing flows

Mapped to the screens that exist today (see `CLAUDE.md` for the flow inventory):

- **Sidebar / shell** — the "Send payment" CTA is hidden for Viewers.
- **Send payment** — Viewers can't enter it. Operators without the completion flag reach
  the review step but the terminal action reads *"Submit for completion"* rather than
  *"Send"*, and confirmation shows a **pending** state instead of *Sent*.
- **Pending payments** — a queue/list of `pending_completion` payments, visible to
  anyone with completion rights, with a **Complete** action (runs the existing 2FA
  approval step). Not visible to Viewers or to Operators who can't complete.
- **Recipients / Add recipient** — create & edit gated to Operator/Admin; Viewers see
  the list read-only, no "Add recipient".
- **Transactions & Transaction detail** — visible to all roles (read-only for everyone
  anyway).
- **Team** (new, Admin-only) — invite/remove members, assign role, toggle an Operator's
  completion flag.

## Open question

When an Operator without the flag submits a payment, who is expected to pick it up —
any Admin, or a named approver? Current assumption: **any Admin or any
completion-enabled Operator**, no routing. Flag if that's wrong.
