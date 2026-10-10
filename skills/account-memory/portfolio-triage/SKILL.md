---
name: portfolio-triage
description: >-
  Answers "which of my accounts need me this week, and why" for an Account
  Manager, by checking every account record they have against a fixed set of
  rules — overdue commitments, accounts gone quiet, renewals coming up, issues
  left open too long, and champions who have left — and ranking the accounts
  with the specific reasons and one next step each. Use when the AM says
  things like "which accounts need me this week", "triage my portfolio",
  "what should I focus on today", "Monday review", "what's overdue across my
  accounts", "who haven't I talked to in a while", or "any renewals coming
  up". Do NOT use for a deep risk diagnosis of one account, preparing a
  specific call, QBR or renewal, or logging a conversation — those are
  separate skills in the health-and-risk, onboarding, qbr-and-reporting,
  renewals and account-memory categories.
metadata:
  version: 1.0.0
  author: JJScar
  audience: non-technical
---

# Portfolio Triage

You're giving an Account Manager a short, trustworthy answer to "where should I spend my time this week?" across all their accounts. Every flag you raise must come from something written in an account record. The value of this skill is that the AM can act on the list without double-checking it, so never pad it with guesses.

## Before starting

1. **Find the records.** In a Claude Project, every account record is a file like `acme-corp.md` in the Project's files. If a tool that lists or reads account records is available, use it. If the AM pasted records, use those. If there are none, say so and point them to the `log-interaction` skill to start one.
2. **Know today's date.** Every rule depends on it. Use the date you're given in the conversation; if you don't have one, ask.
3. **Check the thresholds.** Defaults are below. If the AM has said they want different ones ("flag anything quiet for a week"), use theirs and mention it in the output.

## The rules

Check every account against all five. Read the record format carefully: dates are `YYYY-MM-DD`, and `unknown` means unknown.

| Flag | Fires when | Tier |
| --- | --- | --- |
| **Overdue — ours** | A commitment with Owner `us`, Status `open`, and a Due date before today | **Critical** if more than 7 days overdue, otherwise **High** |
| **Overdue — theirs** | A commitment with Owner `them`, Status `open`, and a Due date before today | **Watch** |
| **Gone quiet** | The most recent date in `last_contact` is more than 14 days ago | **High** |
| **Renewal coming up** | `renewal_date` is today or within the next 90 days | **Critical** if within 30 days, otherwise **High** |
| **Issue left open** | An issue with Status `open` or `blocked` and an Opened date more than 21 days ago | **High** |
| **Champion gone** | A stakeholder with Champion `yes` and Status `left` (by convention, this means nobody has replaced them yet) | **Critical** |

An account's tier is its most serious flag.

**Data gaps are not flags.** When a rule can't be checked because the record doesn't say, list it under "Data gaps" instead. Don't guess, and don't count it towards the ranking:

- no `renewal_date`
- nothing in `last_contact`
- no stakeholder with Champion `yes`
- an open commitment of ours with Due `unknown`
- an open or blocked issue with Opened `unknown`

## Ranking

1. Critical accounts first, then High, then Watch.
2. Within a tier, accounts with more flags come first; if that's tied, alphabetical.
3. Accounts with no flags go on a single "Fine this week" line at the end.

Use the same ranking every time so that two runs on the same records give the same order.

## Output

Keep it scannable. Lead with the count, then one block per flagged account:

```
Week of 2026-10-12 — 4 accounts, 3 need you

1. Acme Corp — Critical
   - Overdue — ours: v4 migration guide for Priya (C-002), due 2026-10-03, 9 days late
   - Issue left open: ACME-142 webhook retries, open for 40 days
   - Renewal coming up: 2026-12-15, in 64 days
   → Next: send the migration guide today, and get an ETA on ACME-142 before the renewal conversation starts.

2. Vandelay Industries — Critical
   - Champion gone: Rita Vance (left; last seen 2026-09-10), nobody named to replace her
   - Gone quiet: no contact for 32 days (last: email 2026-09-10)
   - Overdue — theirs: Owen Pratt owes the Q4 services list (due 2026-09-30)
   → Next: email Owen to ask who's taking over from Rita, and ask for the services list while you're there.

3. Umbrella Labs — Critical
   - Renewal coming up: 2026-10-30, in 18 days
   → Next: book a call with Alex Moreau this week and send the renewal quote.

Fine this week: Initech.
Data gaps: Umbrella Labs has no contact dates and no champion on record; its renewal quote (C-001) has no due date.
```

For each flag, cite the specifics: who, what, which date, how many days. Then give **one** next step per account. Make it concrete and doable this week, and where you can, combine the flags into a single action, like the example above. If the right step is "find out", say so plainly.

Close by offering to go deeper on any one account (single-account risk triage, call prep, renewal prep) or to log anything that's happened since the records were last updated. Don't start those yourself.

## Rules

- Every flag must point to a specific row or field in a record. If you can't point to it, it isn't a flag.
- Never fill a gap from general knowledge or by inferring from other fields.
- Count days exactly from today's date, and show the number.
- Don't change records here. If the AM says something is already done ("I sent the guide yesterday"), take it off the list for this answer and offer to log it with `log-interaction`.

## Examples

- **AM says:** "Which accounts need me this week?" → **Result:** Agent reads every record in the Project, applies the five rules against today's date, and returns the ranked list with specific reasons, one next step per account, a "Fine this week" line and any data gaps.
- **AM says:** "Anything overdue across my accounts?" → **Result:** Same check, but the output only covers the two overdue rules, ours first.
- **AM says:** "Run triage, but call it quiet after 7 days" → **Result:** Agent uses 7 days for the gone-quiet rule, says so at the top, and keeps the other defaults.

## Related skills

Diagnosing why a single account is at risk (`churn-signal-triage`), preparing a call, QBR or renewal, and logging a conversation (`log-interaction`) are separate skills. Triage points the AM at them; it doesn't do their job.
