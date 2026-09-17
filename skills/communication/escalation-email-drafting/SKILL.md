---
name: escalation-email-drafting
description: >-
  Helps a technical Account Manager draft escalation and stakeholder emails
  when something's off track: a customer-facing issue/delay notice, an
  apology, an internal ask for exec or cross-functional help, or a
  stakeholder status update. Use when the AM says things like "draft an
  escalation email for [customer]", "write an internal escalation to get
  help on this account", "how do I tell [customer] about this delay", "draft
  an apology email", or "loop in my manager on this account issue". Do NOT
  use for QBR exec summaries, renewal proposal emails, routine kickoff
  agendas, or deciding how severe a risk is (run churn-signal-triage first
  if that hasn't been done) — those belong to the qbr-and-reporting,
  renewals, onboarding, and health-and-risk categories.
metadata:
  version: 1.0.0
  author: JJScar
  audience: technical
---

# Escalation & Stakeholder Email Drafting

You're helping a technical Account Manager draft a message for a situation that's off track — not a routine update. This skill produces a draft for the AM to review and send themselves; it never claims to have sent anything, and it flags when something needs legal/comms sign-off before it goes out.

## Before starting

Ask the AM:

1. Who's this for — the customer directly, a customer exec, an internal manager, or a cross-functional team (support/product/legal)?
2. What actually happened? Get the facts plainly — don't let the AM (or yourself) soften what went wrong before drafting; you can control tone without hiding substance.
3. What's the ask or the goal of this message — an apology plus a fix timeline, an internal request for help, or just keeping people informed?
4. Any constraints — is this the kind of thing (SLA breach, data incident, anything with financial/contractual weight) that needs legal or comms review before it's sent?

If this is really a question of *how bad is this* rather than *how do I say it*, and the AM hasn't already assessed that, suggest running `health-and-risk`/`churn-signal-triage` first — this skill drafts the message, it doesn't decide the severity.

## Message types

### Customer-facing issue notice or apology

Acknowledge what happened plainly — don't bury it in caveats or hedge it into vagueness. State: what happened (factually, without over-explaining internal root cause unless the customer needs it), what's being done, a concrete timeline, and who the customer's point of contact is for updates. Match tone to severity: a minor delay doesn't need an apology-heavy tone, and a real failure shouldn't be minimized with a breezy one.

**Flag before drafting further** if the situation involves an SLA breach, a data/security incident, or anything with contractual or financial implications — that needs legal/comms review before anything goes to the customer, and this skill should say so rather than draft around it.

### Internal escalation ask

State: the account and why it matters (business impact — e.g. renewal timing, churn risk, deal size), the specific ask (what you need, from whom, by when), and what's already been tried (so the reader isn't sent back to first-line troubleshooting). A vague "can someone help with this account" is not an escalation, it's a shrug — make the ask concrete.

### Stakeholder status update

Lead with the headline status, not a chronological narrative — the reader should know where things stand from the first line. Keep it neutral, and be explicit about whether any action is needed from the recipient or this is purely informational.

## Workflow

1. Identify the message type (above) from what the AM describes — ask if it's ambiguous.
2. Gather the facts plainly (don't let severity get softened at the fact-gathering stage — tone is a drafting choice, not a fact-gathering one).
3. Flag if legal/comms review looks warranted, before spending effort on a full draft.
4. Draft the message, matching structure to the type above.
5. Ask whether a companion piece is also needed — e.g. a customer-facing notice plus an internal heads-up to the AM's manager about the same situation. Draft only what's asked for.

## Data safety

Everything above uses fabricated placeholder situations, not real incident details. In actual use, the AM is working with a real situation — that's expected. What's not fine: this skill inventing facts about what happened, promising a specific fix timeline the AM didn't confirm, or making a commitment on the company's behalf. Draft only what the AM has actually told you; flag anything that reads like an unconfirmed promise before finalizing.

## Examples

- **AM says:** "Draft an escalation email for Acme Corp, we missed their go-live date" → **Result:** Agent gathers what actually happened and the current fix timeline, asks whether this needs legal/comms review, then drafts a plain acknowledgment with the timeline and point of contact — no invented root-cause explanation, no over-apologizing.
- **AM says:** "I need to get my manager's attention on this account, support isn't responding fast enough" → **Result:** Agent drafts an internal escalation with the business-impact reason, the specific ask (e.g. "need a P1 response within 24 hours"), and what's already been tried — not a vague "please help."
- **AM says:** "Write an update for the customer's stakeholders on where we are" → **Result:** Agent asks whether this is a healthy update or something more serious; if serious and severity hasn't been assessed, suggests churn-signal-triage first; otherwise drafts a status-first, neutral update.

## Related skills (not yet written)

QBR exec summaries, renewal proposals, kickoff agendas, and churn-risk assessment are separate skills (`qbr-and-reporting`, `renewals`, `onboarding`, `health-and-risk` categories). This skill only drafts the message once the underlying situation and severity are already understood.
