# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

> **This repo has moved on since that handoff.** A Claude Code session picked up where Claude
> Design left off, and the design work has kept going well past the original bundle — read
> **[`CLAUDE.md`](CLAUDE.md)** next, right after the chat transcripts below. It explains what
> changed and, where it disagrees with the rest of this README, **`CLAUDE.md` wins.**

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 2 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Then read [`CLAUDE.md`](CLAUDE.md).** It picks up immediately after this README and covers everything since. Most importantly: the file below (`project/Onboard Business - Onboarding & Accounts.html`) was the primary design **at handoff time**, but it's since been superseded — the codebase split into `v0/` (frozen/legacy) and `v1/` (the current canonical adaptive prototype, desktop + mobile). `CLAUDE.md` points to `v1/HANDOFF.md` for the actual current state; don't build against `project/` without checking there first.

**Read `project/Onboard Business - Onboarding & Accounts.html` in full** — only if `CLAUDE.md` tells you to (e.g. you're after historical context, not current implementation). The user had this file open when they triggered the original handoff, so it was the primary design at the time. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file (original Claude Design handoff bundle)
- `CLAUDE.md` — **read this next**; covers everything that happened after the handoff, and is the current source of truth where it disagrees with this README
- `chats/` — conversation transcripts (read these!)
- `project/` — the original `Onboard Business Design System v1` handoff files (HTML prototypes, assets, components) — **superseded, see `CLAUDE.md`**
- `v0/` — first Claude Code iteration; now frozen/legacy (see `CLAUDE.md`)
- `v1/` — the current canonical adaptive prototype (desktop + mobile); see `v1/HANDOFF.md`
