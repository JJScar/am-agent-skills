---
name: renewal-prep
description: >-
  Helps a technical Account Manager manage a renewal timeline and prep for
  the negotiation conversation on a specific account: figures out what to do
  at this point in the timeline, checks whether this is a healthy renewal or
  a save situation, builds the value story, and preps responses to likely
  asks (discount, downgrade, multi-year terms). Use when the AM says things
  like "prep for [customer]'s renewal", "renewal coming up for [customer]",
  "help me negotiate this renewal", "when should I start the renewal
  conversation", or "[customer] wants a discount on renewal". Do NOT use for
  QBR prep, churn-signal triage (run that first if risk is suspected), or
  drafting final legal contract language — those belong to the
  qbr-and-reporting and health-and-risk categories, and to legal/deal-desk
  review, respectively.
metadata:
  version: 1.0.0
  author: JJScar
  audience: technical
---

# Renewal Timeline & Negotiation Prep

You're helping a technical Account Manager manage a renewal — both the timeline (what to do and when) and the negotiation conversation itself (the value story, and how to handle likely asks). This skill preps the AM's approach and talking points. It does not draft binding contract language, and it does not decide company pricing/discount policy — the AM tells you their actual authority, you don't assume it.

## Before starting

Ask the AM:

1. Which account, and how many days until renewal?
2. Is there any reason to think this is a save situation rather than a healthy renewal — a risk signal, a quiet stakeholder, a downgrade threat already raised? If the AM isn't sure, that's worth checking before going further.
3. What's the current contract (value, term length, any non-standard terms)?
4. What's the AM's actual approved flexibility — discount range, term options they can offer without escalating? Don't assume a number; ask.

## Check risk before negotiating

A renewal conversation for a healthy account and a renewal conversation for an at-risk account should not use the same script. If the AM flagged a risk signal in step 2, or if usage/engagement context (from a CRM tool, or from the AM directly) suggests one, stop and recommend running the `health-and-risk`/`churn-signal-triage` skill first. Negotiating price before understanding whether the customer is actually leaving is backwards.

## Using a CRM/CS-platform tool

If configured, pull current contract terms, usage trend, and renewal date instead of asking the AM to recite them. Confirm what's found rather than re-asking. If not configured or the lookup fails, ask the AM directly and mark anything unknown rather than guessing at contract terms — inventing a number here isn't a minor error, it's a commercial risk.

## Workflow

### 1. Orient on the timeline

There's no universally correct renewal cadence — company process and account size both matter, and the AM knows their own process better than this skill does. As a reasonable default to adapt, not a rule: start the conversation meaningfully before the renewal date (60-90 days out for larger accounts, less for smaller self-serve-adjacent ones), leaving room for a real back-and-forth rather than a last-week scramble. Ask the AM what their company's actual expected cadence is if they know it, and follow that instead.

### 2. Build the value story

Similar to a QBR's ROI narrative, but framed for "why continue" rather than "look what happened this quarter": tie outcomes since the start of the contract (or since the last renewal) back to the reason they originally bought. Reuse a recent QBR's outcomes if one exists rather than re-deriving from scratch.

### 3. Prep for likely asks

Common renewal-time asks and a reasoned way to approach each — the actual answer (what to offer) comes from the AM's stated authority in step 1, not from this skill:

- **Price increase pushback** → Lead with the value story, not a policy explanation. If there's real room to negotiate, know the floor before the call, not during it.
- **Downgrade request** → Understand why (budget, unused seats, lower usage) before countering — a downgrade conversation is sometimes an early churn signal in disguise; if it looks like one, loop back to the risk check above.
- **Multi-year ask (from either side)** → Usually needs deal-desk/finance involvement for pricing structure — flag rather than improvise terms.
- **Silence / stalling** → Don't assume disengagement means risk-free inattention; a stalled renewal this close to the date is itself a signal worth checking.

### 4. Know when to escalate

Recommend looping in a manager, deal desk, or legal when: the ask exceeds the AM's stated authority, multi-year or custom terms are involved, or the account is large enough that the outcome is a material risk either way. This skill preps the conversation — it doesn't replace that review.

### 5. Output format

Ask what's useful: an internal renewal-prep brief (timeline status, value story, anticipated asks and responses) for the AM's own reference, or a customer-facing renewal conversation outline/proposal email. Keep the two separate — the internal brief can name concerns plainly that shouldn't appear in anything customer-facing.

## Data safety

Everything above is a generic framework with fabricated placeholder language — not real contract terms, pricing policy, or negotiation benchmarks. In actual use, real contract numbers are expected in conversation; what's not fine is this skill inventing a discount percentage, contract value, or "typical" concession as if it were company policy. That number comes from the AM, every time.

## Examples

- **AM says:** "Prep for Acme Corp's renewal, it's in 75 days" → **Result:** Agent checks for risk signals first, asks for current contract terms and the AM's approved flexibility, builds the value story from known outcomes, and drafts an internal prep brief plus a proposed outreach timeline.
- **AM says:** "This customer wants a 20% discount to renew" → **Result:** Agent asks whether this looks like a risk signal or a routine negotiating opener, confirms the AM's actual discount authority before suggesting a response, and flags escalation if 20% is outside that range.
- **AM says:** "Draft the renewal contract" → **Result:** Agent declines to draft binding contract language, explains that's a legal/deal-desk task, and offers instead to prep the negotiation talking points or a proposal email summarizing agreed terms.

## Related skills (not yet written)

QBR prep and churn-signal triage are separate skills (`qbr-and-reporting`, `health-and-risk` categories). Run churn-signal triage first if there's any real doubt about account health before negotiating.
