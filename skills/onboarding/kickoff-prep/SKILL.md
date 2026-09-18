---
name: kickoff-prep
description: >-
  Helps a technical Account Manager prep for a new customer's kickoff call and
  the sales-to-onboarding handoff: gathers account context, maps stakeholders,
  drafts a kickoff agenda, and sketches a first-pass success plan with
  milestones. Use when the AM says things like "prep my kickoff call", "new
  customer just closed, help me onboard them", "build a success plan for
  [customer]", "draft the implementation handoff", or "first call with
  [customer] is next week". Do NOT use for ongoing health scoring or churn
  triage, QBR/EBR prep on an existing account, or renewal/negotiation prep —
  those belong to separate skills in the health-and-risk, qbr-and-reporting,
  and renewals categories.
metadata:
  version: 1.0.0
  author: JJScar
  audience: technical
---

# Kickoff & Onboarding Prep

You're helping a technical Account Manager get ready for a new customer's first 30 days: the kickoff call, the sales-to-CS handoff, and a first-draft success plan. The output should be something the AM can act on immediately — an agenda they can send, a stakeholder map they can fill gaps in, a success plan they can review with the customer — not a generic essay on onboarding best practices.

## Before starting

Ask the AM (don't guess at specifics you don't have):

1. Customer name and the plan/tier they bought.
2. What problem did they buy this to solve? (Pull from the sales handoff/CRM notes if available — see "Using a CRM tool" below.)
3. Who are the known stakeholders so far — champion, economic buyer, technical admin, exec sponsor (if enterprise)?
4. Any commitments made during the sales process (custom timelines, specific integrations, success metrics) that the AM needs to honor?
5. When is the kickoff call, and who from the customer side is confirmed to attend?

If the AM doesn't have an answer yet, note it as an open item in the output rather than inventing one — a wrong guess about a real customer is worse than a visible gap.

## Using a CRM/CS-platform tool

See [`docs/crm-tool-calling-convention.md`](../../../docs/crm-tool-calling-convention.md) for the full convention this follows.

If the AM has a CRM or CS-platform MCP tool configured, use it to pull the account record, sales notes, and contract details instead of asking for everything by hand — confirm what you found rather than re-asking questions it already answers.

If no such tool is configured (or the lookup fails), say so plainly and fall back to asking the AM directly. Never fabricate account specifics — contract value, dates, stakeholder names — to fill a gap silently.

## Workflow

### 1. Build the stakeholder map

A lightweight table: name, role, stakeholder type (champion / economic buyer / technical admin / exec sponsor / end user), and any notes on their priorities. Flag which roles are still unknown — that's a real gap to close on the kickoff call, not something to leave implicit.

### 2. Draft the kickoff call agenda

Standard shape, adapted to what's actually known about this account:

- Intros and roles on both sides
- Recap of why they bought and what success looks like to them (confirm, don't assume)
- Proposed timeline and milestones
- Roles and responsibilities (who does what, on both sides)
- Risks or dependencies the customer should flag early
- Next steps and the date of the next check-in

See `references/kickoff-agenda-example.md` for a fully worked example (fabricated company) if the AM wants to see the shape filled in before drafting their own.

### 3. Draft the sales-to-CS handoff checklist

Pull together what CS/the AM needs from sales before kickoff: signed contract terms, any commitments made during the sales cycle, technical requirements gathered so far, known blockers, and the primary use case in the customer's own words. Flag anything missing as a question back to the AE, not as an assumption.

### 4. Sketch a first-pass success plan

A 30/60/90-day skeleton tied to the reason they bought, not a generic template:

| Milestone | Target | Success signal | Owner |
|---|---|---|---|
| Kickoff complete | Day 0–7 | Stakeholders aligned, timeline agreed | AM |
| First value achieved | Day 30 | [tied to their stated use case] | AM + customer |
| Adoption milestone | Day 60 | [e.g. team onboarded, core workflow live] | Customer |
| Success review | Day 90 | Customer confirms initial goal met | AM |

Treat the "success signal" and "adoption milestone" rows as placeholders to fill from what the AM told you about this specific account — don't ship the generic labels above as the final plan.

### 5. Offer the output in a usable format

Ask (don't assume) whether the AM wants: an internal handoff summary (email/Slack-ready), a customer-facing kickoff agenda, the success plan as a standalone doc, or all three. Draft only what's asked for.

## Data safety

Everything in this skill file uses fabricated example data. In actual use, the AM will be working with real customer information — that's expected and fine, since this is a live conversation, not skill content. What's not fine: inventing specifics (names, dates, commitments) about a real account when you don't actually know them. Ask instead.

## Examples

- **AM says:** "Prep my kickoff call for Acme Corp, they signed yesterday" → **Result:** Agent asks for plan tier, known stakeholders, and the stated reason they bought; checks the CRM tool if configured; drafts a stakeholder map with gaps flagged, a kickoff agenda, and asks whether a success-plan draft is also wanted.
- **AM says:** "Build a success plan for the account we just closed" → **Result:** Agent asks which account (if not already in context), confirms the core use case and any sales-cycle commitments, then drafts the 30/60/90 skeleton with placeholders clearly marked where account-specific detail is still needed.
- **AM says:** "What do I need from sales before I take this account?" → **Result:** Agent produces the sales-to-CS handoff checklist and flags which items it doesn't yet have answers for.

## Related skills (not yet written)

Ongoing health scoring, churn triage, QBR prep, and renewal prep for this account are handled by separate skills once they exist (`health-and-risk`, `qbr-and-reporting`, `renewals` categories). Don't attempt those workflows from within this skill — hand off cleanly and say so if the AM asks for one of them here.
