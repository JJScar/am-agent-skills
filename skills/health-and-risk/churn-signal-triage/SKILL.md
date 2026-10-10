---
name: churn-signal-triage
description: >-
  Helps an Account Manager triage churn-risk signals on a single account,
  using the account record if one exists, work out a likely root cause, and
  pick a save play — not to design a company-wide health-scoring system. Use
  when the AM says things like "this account is going quiet", "why is Acme at
  risk", "why is [customer] at risk", "is this account at risk", "signs of churn
  on this account", "help me triage this account's health", "should I
  escalate this account", or "haven't heard from [customer] in weeks". Do NOT
  use for kickoff/onboarding prep, QBR/EBR prep, or renewal negotiation prep
  — those are separate skills in the onboarding, qbr-and-reporting, and
  renewals categories.
metadata:
  version: 1.1.0
  author: JJScar
  audience: both
---

# Churn Signal Triage

You're helping an Account Manager figure out, right now, whether a specific account is actually at risk and what to do about it. This is a triage tool for one account in the moment — not a framework for building the company's health-scoring system, and not a substitute for the AM's own judgment about the relationship.

## Before starting

Ask the AM:

1. Which account, and what triggered the concern? (A specific event — e.g. a missed call, a usage drop the AM noticed — or a general "something feels off"?)
2. What do they already know: recent usage trend, last meaningful contact, any recent support tickets, any team/stakeholder changes on the customer side?
3. Is there a CRM/CS-platform tool configured to pull this instead of the AM reciting it from memory? (See below.)

Don't assume severity from the trigger alone — "haven't heard from them in two weeks" means something different for a self-serve SMB account than for an enterprise account with a quarterly cadence.

## Using the account record

The AM may keep a persistent record for this account: a file like `acme-corp.md` in their Claude Project, a record from a tool that reads account records, or one they paste in. **Look for it before asking anything.** If it's there:

- Read it first, and don't ask questions it already answers. Confirm what you found instead ("Your record says the renewal is 2026-12-15 — still right?").
- Before the main output, flag in a line or two anything in it that matters here: commitments of ours that are `open` and past their due date, and stakeholders marked `left` or newly added.
- Most signal categories can be read straight from the record: **Engagement** from `last_contact` and the Timeline; **Support** from Issues that are `open` or `blocked` and how long they've been open; **Relationship** from Stakeholders (a champion who `left`, or only one active contact); **Commercial** from `renewal_date`. Overdue commitments of ours count too — missed promises erode trust. The record doesn't hold usage data, so that category still comes from a CRM tool or the AM.

If there's no record, say so in one line and carry on with the questions above. Never treat the record as complete: `unknown` means unknown, and something missing from the record isn't evidence either way.

## Using a CRM/CS-platform tool (optional)

See [`docs/crm-tool-calling-convention.md`](../../../docs/crm-tool-calling-convention.md) for the full convention this follows.

On top of the account record, if a CRM/CS-platform MCP tool is configured, use it to pull usage trend, recent support tickets, and last-contact date instead of asking the AM to recall all of it. Confirm what you found rather than re-asking.

If no tool is configured, or the lookup fails, say so and ask the AM directly for what they know. Don't invent a usage trend or ticket history you don't actually have — an unverified guess presented as fact is worse than an honest "unknown."

## Workflow

### 1. Gather signals across categories

Pull together what's known in each category — leave a category explicitly "unknown" rather than skipping it silently:

| Category | What to look for |
|---|---|
| Usage/adoption | Trending down, flat, or never ramped past initial rollout |
| Engagement | Meetings/emails going unanswered, single-threaded (one contact only) |
| Support | Ticket volume or sentiment spiking, unresolved escalations |
| Relationship | Champion left or gone quiet, no exec sponsor engagement, competitor mentioned |
| Commercial | Downgrade inquiry, questioned pricing, contract nearing end with no renewal conversation started |

### 2. Assess rough severity

Don't manufacture a precise score — that needs real historical data this skill doesn't have. Instead, reason qualitatively:

- **1 category affected, mild** → Watch. Note it, set a follow-up, no special action yet.
- **2+ categories affected, or one severe (e.g. champion left, active competitor evaluation)** → At risk. Needs a deliberate save play this week, not just a note.
- **Imminent signal** (explicit cancellation/downgrade request, contract expiring with no engagement) → Critical. Needs escalation now, not just a play.

State your reasoning for the tier, don't just output a label — the AM needs to be able to check your logic against what they know that you don't.

### 3. Identify the likely root cause

Match the signal pattern to a probable cause — this drives which save play makes sense. See `references/signal-to-play-reference.md` for the fuller mapping. Common patterns:

- Usage down + support quiet + champion still engaged → likely low adoption/onboarding gap, not dissatisfaction.
- Champion gone quiet + no replacement contact → relationship/stakeholder risk, not necessarily product dissatisfaction.
- Support tickets spiking + sentiment negative → product/support friction.
- Pricing questioned + usage healthy → commercial/budget pressure, not product failure.

If the signals don't clearly point to one cause, say so and suggest the AM ask directly on the next call rather than guessing.

### 4. Recommend a save play, matched to the cause

Don't recommend a generic "check in with the customer" play when the evidence points somewhere more specific. Tie the recommendation to what was actually observed, and flag when the right move is honestly just "ask them" because the signal is ambiguous.

### 5. Decide on escalation

Recommend looping in a manager or exec sponsor when: the tier is Critical, the account is large enough that losing it is a material risk, or the AM doesn't have the authority to make the likely concession (pricing, custom terms). Otherwise, this stays with the AM.

### 6. Output format

Ask what's useful: a risk-flag summary for a CRM note, an internal Slack/email flag to a manager, or a draft outreach message to the customer. Draft only what's asked for, and keep the internal summary and any customer-facing draft clearly separate — they say different things.

### 7. Offer to log what's new

If this conversation turned up anything the account record doesn't have yet (a new commitment, including any date or fix promised in a draft; a new or departed stakeholder; an issue update), list it briefly and offer to log it with the `log-interaction` skill. Don't edit the record yourself here.

## Data safety

Everything above uses fabricated example categories and reasoning, not real benchmark statistics. In actual use, the AM is working with a real account — that's expected. What's not fine: presenting an invented usage number, ticket count, or churn probability as if it were measured data. If you don't have the number, say so and ask or flag it as unknown.

## Examples

- **AM says:** "This account's gone quiet, should I be worried?" → **Result:** Agent asks what "quiet" means concretely (no replies for how long, on what channel), checks the CRM tool if configured for usage/support signals, then reasons through a tier with visible logic rather than a bare label.
- **AM says:** "Why is Acme Corp at risk?" → **Result:** Agent pulls or asks for signals across the five categories, identifies the most likely root cause pattern, and recommends a save play tied to that cause — not a generic "schedule a check-in."
- **AM says:** "Should I escalate this to my manager?" → **Result:** Agent applies the escalation criteria (tier, account size, AM's authority to act) and gives a clear yes/no with reasoning, not just "maybe, use your judgment."

## Related skills

Renewal negotiation, QBR prep, and kickoff/onboarding are separate skills (`renewals`, `qbr-and-reporting`, `onboarding` categories). Checking every account at once for who needs attention this week is `portfolio-triage`, and logging conversations is `log-interaction` (both `account-memory`). If the AM's real need is one of those, say so and don't try to cover it here.
