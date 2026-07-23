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

## Completion routing (decided)

When an Operator without the flag submits a payment, it can be picked up by **any Admin
or any completion-enabled Operator** — no routing, no assignment, no named approver. It
simply appears in the shared pending list for everyone who's allowed to complete.

## UI surface

What this model requires, split by whether the screen exists today.

> These are the current structural ideas, not locked — the final page shape is an
> implementation-time decision. The permission *rules* below hold regardless of how the
> pages are arranged.

### New pages / flows

- **Payments hub** — rather than a standalone "Send payment" destination, a richer
  Payments page that holds it all: the transactions list, the **pending** queue, and the
  entry point to start a new payment. This absorbs today's separate Transactions page and
  the send flow; the pending `pending_completion` items live here (a tab or filter)
  rather than as their own nav item, ideally with a count on the pending view. Starting a
  new payment becomes an action launched from this page.
- **Team** — lives as a tab **inside Settings** (which already exists for profile /
  security), Admin-only. A member list (name, email, role, status) plus:
  - **Invite member** — email + role picker; if role is Operator, the *"can complete
    payments"* toggle. This is the biggest new lift because moving invites in-app means
    a new **invite → accept → account setup** path for the invited person (today that's
    a back-office step). Worth scoping on its own.
  - **Edit member** — change role, toggle an Operator's completion flag.
  - **Remove member.**

### Changes to existing flows

- **New-payment flow** — for an Operator without completion rights, the review step's
  terminal button reads *"Submit for completion"* not *"Send"*, and the confirmation
  shows a **pending** state instead of *Sent*. Everyone else is unchanged.
- **Payment detail** — a `pending_completion` item needs a detail view that shows who
  initiated it and, for those with completion rights, the **Complete / Cancel** actions
  (Complete runs the existing 2FA step).
- **Sidebar / shell** — hide the payments entry / new-payment CTA for Viewers; show the
  **Settings → Team** tab only to Admins.
- **Recipients** — hide "Add recipient" for Viewers (list stays read-only).
- **Role visibility** — a small indication of the current user's role (e.g. in the
  profile menu), so people understand why an action is or isn't available.

### Permission / empty states

Every gated action needs a defined "you can't do this" state — Viewers landing on a
list with no create button, an Operator seeing a submitted-not-sent confirmation. These
are cheap but easy to forget; call them out per screen when we build.

> Note: none of the above is mocked yet — this is the page inventory to work from when
> we do. In the prototype these gates would be driven by a "current role" mock control.
