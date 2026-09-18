---
name: qbr-prep
description: >-
  Helps a technical Account Manager prepare a QBR/EBR for an existing
  account: pulls together usage and outcomes since the last review, builds an
  ROI narrative tied to why they bought, and produces a deck outline plus a
  one-page exec summary. Use when the AM says things like "prep my QBR for
  [customer]", "build a QBR deck", "help me put together an EBR", "quarterly
  business review for [customer]", or "exec summary for [customer]'s QBR".
  Do NOT use for kickoff/onboarding prep, churn-signal triage (a QBR can
  surface a real risk worth flagging, but triaging it is a separate skill),
  or renewal negotiation — those are separate skills in the onboarding,
  health-and-risk, and renewals categories.
metadata:
  version: 1.0.0
  author: JJScar
  audience: technical
---

# QBR / EBR Prep

You're helping a technical Account Manager prepare a Quarterly (or Executive) Business Review for an existing account. The goal is a review that shows the customer real outcomes tied to why they bought — not a generic usage-metrics dump. If you don't know what they were trying to achieve, ask; don't guess.

## Before starting

Ask the AM:

1. Which account, and what's the audience — the day-to-day champion, an exec sponsor, or both?
2. What period does this review cover, and is there a prior QBR or the original success plan to compare against?
3. What format is actually needed: a full deck outline, a one-page exec summary, talking points, or all three?
4. Is there anything the AM already knows is a soft spot (usage dip, unresolved issue, slow adoption) that needs careful framing rather than a surprise reveal in the meeting?

## Using a CRM/CS-platform tool

See [`docs/crm-tool-calling-convention.md`](../../../docs/crm-tool-calling-convention.md) for the full convention this follows.

If a CRM/CS-platform tool is configured, pull usage trend, support ticket history, and (if it exists) notes from the original kickoff/success plan or a prior QBR, instead of asking the AM to reconstruct all of it. Confirm what you found.

If no tool is configured, or something can't be found, ask the AM directly and note it as unknown rather than inventing a trend or number to fill the gap.

## Workflow

### 1. Gather outcomes since the last review

Pull together, per what's actually known: usage/adoption trend, milestones hit against the original success plan (if one exists — see the `onboarding`/`kickoff-prep` skill), notable support history, and any team or stakeholder changes on the customer side. Mark anything unknown rather than skipping it silently.

### 2. Build the ROI narrative

Tie outcomes back to the reason they bought, not to metrics for their own sake. "Usage is up 20%" means nothing on its own — "usage is up because the team you said needed to adopt this now has, and that's the outcome you told us mattered" is the actual narrative. If the original reason they bought isn't known, ask before writing generic ROI language.

### 3. Structure the review

Standard shape, trim to what's actually relevant for this account:

- Recap: what were we trying to achieve, and what's changed since the last review
- Outcomes and wins, tied to the ROI narrative above
- Usage/adoption summary — enough to support the narrative, not a raw data dump
- Open items or challenges — name them plainly, don't bury a real issue in a "looking ahead" slide
- What's next — roadmap relevant to this customer, upcoming milestones
- The ask — what does the AM actually want from this meeting? (Renewal alignment, expansion interest, an advocacy ask, exec sponsor engagement?) A QBR without a clear ask is a status update, not a business review.

See `assets/qbr-deck-outline.md` for a fillable template following this structure.

### 4. Draft the one-page exec summary

For a sponsor who won't sit through the full deck: the headline outcome, one supporting number, the single most important open item (if any), and the ask. Keep it to what an exec actually needs to make a decision or give air cover — not a condensed version of every slide.

### 5. Flag internal risks before the meeting

If gathering outcomes surfaced something concerning (usage dropped, a stakeholder went quiet, a support pattern looks bad), say so plainly to the AM — but don't run a full risk triage here. If it looks like a real concern, suggest the AM follow up with the `health-and-risk`/`churn-signal-triage` skill separately rather than folding that analysis into the QBR prep.

### 6. Output format

Produce only what was asked for in step 1 — deck outline, exec summary, talking points, or a combination.

## Data safety

Everything above uses fabricated placeholder language, not real account data or invented metrics. In actual use the AM is working with a real account — expected. What's not fine: presenting a made-up usage number, ROI figure, or outcome as if it were verified. If you don't have it, ask or mark it unknown.

## Examples

- **AM says:** "Prep my QBR for Acme Corp, it's next Tuesday" → **Result:** Agent asks for audience and format, pulls or asks for outcomes since the last review, confirms the original reason they bought before drafting ROI language, and produces a deck outline via the template.
- **AM says:** "I need a one-pager for the exec sponsor" → **Result:** Agent drafts the headline outcome, one supporting number, the most important open item if any, and a clear ask — not a shrunk version of the full deck.
- **AM says:** "Usage has actually dropped for this account, what do I do for the QBR?" → **Result:** Agent flags this plainly, suggests framing it honestly in the review rather than hiding it, and recommends the AM run churn-signal-triage separately if it looks like a real risk rather than trying to resolve it inside the QBR prep.

## Related skills (not yet written)

Kickoff/onboarding, churn-signal triage, and renewal negotiation are separate skills (`onboarding`, `health-and-risk`, `renewals` categories). If a QBR conversation surfaces a real risk or turns into renewal negotiation, hand off rather than trying to cover it here.
