# Account Manager skills

Generated from the am-skills repo — do not edit by hand. Run `npm run build:project-template` to regenerate.

## How to use this file

This file holds several skills, each starting with a `# Skill: <name>` heading and a
"When to use it" line. When the Account Manager asks for something, find the skill whose
"When to use it" matches and follow its instructions. When a skill tells you to read
a file such as `references/record-format.md`, read the `## File: references/record-format.md`
section under that same skill. Links into `docs/` point at the am-skills repo and aren't
available here; everything a skill needs is in this file.

Skills in this file: `log-interaction`, `portfolio-triage`, `kickoff-prep`, `churn-signal-triage`, `renewal-prep`, `qbr-prep`, `escalation-email-drafting`.

# Skill: log-interaction

**When to use it:** Updates an Account Manager's persistent account record from a call transcript, call notes, email thread or chat export — pasted in, or pulled from a connected meeting notetaker such as Granola when the AM has allowed it in their settings. It pulls out new commitments (ours and theirs), stakeholder changes, issues and a timeline entry, shows the changes for the AM to confirm, then produces the updated record. Use when the AM says things like "log this call", "update Acme's record", "here's the transcript from today", "add this email thread to the account", "what did we just agree to", "track what I promised them", or pastes a conversation and asks to save it, or says "log today's Acme call", "pull my Granola notes for Acme", or "log all my calls from this week". Do NOT use for preparing a call, QBR or renewal, triaging which accounts need attention, or drafting a reply to the customer — those are separate skills in the onboarding, qbr-and-reporting, renewals, communication and account-memory categories.

## Log Interaction

You're keeping an Account Manager's account memory up to date. They give you a conversation with a customer — a call transcript, their own rough call notes, an email thread, or a Slack/Telegram export — or ask you to fetch it from their meeting notetaker, and you turn it into changes to that account's record: what was promised, who's involved, what's broken, and what happened. The AM confirms the changes before anything is saved.

The record format is fixed. It's described in full in `references/record-format.md` — read that before writing a record for the first time in a conversation. Getting the format exactly right matters: the same file is read later by triage and prep skills, and eventually by software.

### Before starting

1. **Which account?** Work it out from the conversation (company name, email domains, channel name). If it's ambiguous, ask.
2. **Find the current record.** In a Claude Project, look for the account's file in the Project's files (named like `acme-corp.md`). If the AM pasted the record, use that. If there's a tool available that reads account records, use it.
   - If there's no record yet, offer to start one. Ask only for the account name; everything else can be filled in from the conversation or left empty.
   - If two files could match, ask which one.
3. **What kind of interaction, and when?** (For notes fetched from a notetaker, the meeting date and attendees come with it.) `call`, `email`, `chat`, `meeting` or `note`, and the date it happened. Email and chat exports usually carry dates. For transcripts and notes, ask "Was this today?" rather than assuming.
4. **Who is "us"?** Commitments are owned by `us` (the AM's company) or `them` (the customer). Use the record's stakeholders and email domains to tell the sides apart. If a speaker's side is unclear, ask — don't guess who owes what.

### Getting the conversation from a notetaker

When the AM asks you to log a call without pasting anything ("log today's Acme call", "pull my Granola notes"), you may fetch it from a connected meeting notetaker, **but only if their settings allow it**. The full rules are in `references/source-settings.md`; read it the first time this comes up in a conversation.

1. **Check the settings.** Find `account-memory-settings.md` in the Project files (or via a tool that reads it). Meeting notes may be read for this account only if `meeting_notes.enabled` is `true`, the account isn't in `exclude_accounts`, and the account's record doesn't say `sources: {meeting_notes: off}`.
   - Settings file missing or unreadable → treat it as off.
   - If it's off, **don't call the notetaker at all**, even if it's connected. Say which rule stopped you and how to change it ("Meeting notes are off in your settings — set `enabled: true` under `meeting_notes` to allow this"), then offer to work from a paste instead.
2. **Find the notetaker.** Look through your available tools for one that searches or reads meeting notes or transcripts (Granola, or similar), judging by its name and description, never by a fixed tool name. If there isn't one, say so ("No meeting-notes tool is connected — you can add Granola in claude.ai under connectors") and ask for a paste.
3. **List, then pick.** Search only within `only_from` folders if any are set. Look at meetings since the last `call` or `meeting` in the record's Timeline (or the last 14 days if there isn't one). Match them to the account by attendee email domains against the record's `domains` first, then by the account or stakeholder names in the title. Show the AM the matches (title, date, attendees) and get them to confirm which to log **before** opening any note in full. If a match is uncertain, ask; don't guess.
4. **Read and log.** Open only the confirmed notes, prefer the full transcript where the notetaker provides one, then follow the normal workflow below. The interaction type is `call` (or `meeting` if it was in person), and the Source is the notetaker plus date, e.g. `granola 2026-10-08`.

**Several calls at once** ("log all my calls from this week"): list that period's meetings, group them by matched account, and handle each account separately with its own preview and confirm. For accounts that aren't allowed, don't open their notes; list them as skipped with the reason. Meetings that match no account get listed for the AM to assign or ignore.

Always end with a one-line summary of what you skipped and why, so the AM can see their settings working: "Skipped 1 meeting: Umbrella Labs (meeting notes turned off in its record)."

### Workflow

#### 1. Extract

Read the whole conversation, then pull out:

- **Commitments** — anything someone said they'd do: "I'll send…", "we'll get back to you by…", "can you share…?" answered with yes. For each: what, owner (`us`/`them`), the person, the due date, and the line it came from.
  - Due dates only when stated. Turn relative dates into real ones using the interaction date ("by Friday" on Tue 2026-10-06 → 2026-10-09) and show the conversion. No date mentioned → `unknown`. Never invent one.
  - Vague intentions ("we should look at that sometime", "I'll try") go under **Needs your call**, not straight into the ledger.
  - Check existing open commitments too: if the conversation shows one was delivered or abandoned, propose moving it to `done` or `dropped`.
  - If someone re-promises something that's already an open commitment (often with a new date), update that row's Due instead of adding a duplicate, and show it as a change.
- **Stakeholders** — new people (name, role), role changes, anyone who's left or is leaving, and who seems to be the champion. Update Last seen for everyone who took part.
  - Never change the champion on your own. If the conversation suggests the champion has left or changed, propose it and say why.
- **Issues** — new bugs, blockers or technical problems, and status changes to existing ones. Use the tracker ID if one is mentioned (`ACME-142`); otherwise the next `I-###`.
- **Timeline** — one entry for this interaction: one or two factual sentences on what happened and what was agreed.
- **Frontmatter** — move `last_contact` for this kind of interaction forward if this one is newer. If new email domains or channels for this customer appear, propose adding them.

#### 2. Show the changes

Before writing anything, show the AM the proposed changes, grouped by section. Use this layout:

```
Proposed changes to Acme Corp (call, 2026-10-08)

Commitments
  + C-006  us   Account manager  Send v4 migration guide          due 2026-10-10
           "I'll get that guide over to you by Friday"
  ~ C-003  open → done   (engineering ETA shared on the call)

Stakeholders
  + Lena Ortiz — Security Lead (new, joined the call)
  ~ Priya Raman — last seen → 2026-10-08

Issues
  ~ ACME-151  blocked → open   ("the SSO fix is back in progress")

Timeline
  + 2026-10-08 call — Monthly sync: ...

Needs your call
  ? "We might be able to do a pilot in Q1" — commitment, or just an idea?
  ? Lena said "I own the vendor relationship now" — make her the champion?

Reply "confirm", or tell me what to change.
```

`+` is new, `~` is a change. Quote the line each new commitment came from so the AM can check it. Keep everything that needs the AM's judgement under **Needs your call** — don't silently drop it and don't silently add it.

#### 3. Apply

Only after the AM confirms (or after you've made their corrections and they've confirmed again):

- **If a tool for saving account records is available**, use it. Show the grouped changes above first anyway, even if the tool has its own preview step.
- **Otherwise**, output the **complete updated record** as one markdown code block — never a partial snippet — and tell the AM how to save it: in a Claude Project, replace the account's file with this version (download or copy it, remove the old file, add the new one).

#### 4. Close

One or two lines: what changed, and anything worth acting on now — for example, a commitment of ours due in the next few days, or "Marco has left and nobody has replaced him as champion".

### Rules

- **Never delete rows.** Departed people become `left`, finished commitments become `done` or `dropped`, fixed issues become `resolved`.
- **Never invent** a date, an owner, a person or a role. Use `unknown` and, if it matters, ask.
- **IDs are never reused.** New commitment IDs continue from the highest existing one.
- **Stick to the record format exactly** — same sections in the same order, same columns, `YYYY-MM-DD` dates, one line per cell.
- **Keep it about the account.** Don't log personal, health or HR details about individuals even if they come up in the conversation. "Out on leave until November" is fine; the reason is not.
- If the conversation contains nothing worth logging, say so and don't produce a record.

### Examples

- **AM says:** "Log this call with Acme" and pastes a transcript → **Result:** Agent finds `acme-corp.md`, asks whether the call was today, shows the grouped changes with quoted evidence for each new commitment and a short "Needs your call" list, then after "confirm" outputs the full updated record and how to save it.
- **AM says:** "Here's the email thread with Globex, what did we just agree to?" → **Result:** Agent answers the question from the thread, then offers to log it — and does so only if the AM says yes.
- **AM says:** "Add this to the record — I promised Dana the migration guide by Friday" → **Result:** Agent treats the AM's own sentence as a `note`, works out Friday's date, proposes one new `us` commitment and a timeline entry, and confirms before producing the record.

### Related skills

Preparing for a call, QBR or renewal, triaging which accounts need attention this week, and drafting replies to the customer are separate skills. If that's what the AM actually wants, say so and offer to log the interaction afterwards instead.

## File: references/record-format.md (part of log-interaction)

### Account record format (v1)

A condensed copy of the account record format, bundled so this skill works on its
own — in a Claude Project or when served over MCP — without access to the rest of
the repo. The full spec is `docs/account-record-schema.md` in the am-skills repo;
if the two ever disagree, that doc wins and this file should be updated to match.

#### Shape

One markdown file per account, named after the account in kebab-case
(`acme-corp.md`). YAML frontmatter, a `#` heading with the account name, then four
table sections that are **always present and always in this order**, plus an
optional `## Notes` section for free prose. No other `##` headings.
`account-memory-settings.md` is the AM's settings file, not an account record — never treat it as one.

```markdown
---
schema_version: 1
name: Acme Corp
domains:
  - acme.example
channels:
  - type: slack
    name: "#ext-acme"
issue_tracker:
  system: jira
  key: ACME
renewal_date: 2026-12-15
last_contact:
  email: 2026-10-06
  call: 2026-09-30
  chat: 2026-10-08
last_refreshed: null
---

# Acme Corp

## Stakeholders

| Name | Role | Champion | Status | Last seen | Notes |
| --- | --- | --- | --- | --- | --- |
| Priya Raman | Staff Engineer, Platform | yes | active | 2026-10-08 | Very responsive in Slack |

## Commitments

| ID | Commitment | Owner | Person | Due | Status | Source |
| --- | --- | --- | --- | --- | --- | --- |
| C-001 | Share the migration guide for the v4 API | us | Account manager | 2026-10-03 | open | call 2026-09-30 |

## Issues

| ID | Issue | Link | Opened | Status |
| --- | --- | --- | --- | --- |
| ACME-142 | Webhook retries drop events under load | https://jira.example/browse/ACME-142 | 2026-09-02 | open |

## Timeline

| Date | Type | Summary |
| --- | --- | --- |
| 2026-09-30 | call | Monthly sync: v4 migration questions, audit-log export pilot agreed |

## Notes

Optional free text.
```

#### Frontmatter fields

| Field | Value |
| --- | --- |
| `schema_version` | Always `1`. |
| `name` | Account display name; matches the `#` heading. |
| `domains` | List of the customer's email domains, or `[]`. |
| `channels` | List of `{type, name}`; `type` is `slack`, `telegram`, `teams`, `discord` or `other`. Or `[]`. |
| `issue_tracker` | `{system, key}` with `system` = `jira`, `linear`, `github` or `other`; or `null`. |
| `renewal_date` | Date or `null`. |
| `last_contact` | Map with any of `email`, `call`, `chat` → date. Omit kinds with no contact. |
| `last_refreshed` | Date or `null`. Not changed by logging an interaction. |
| `sources` | Optional. Per-account opt-out from connected sources, e.g. `{meeting_notes: off}`. Only `off` is allowed; never add or remove it unless the AM asks. |

#### Column values

- **Stakeholders** — Champion: `yes`/`no` (at most one active champion). Status: `active`, `left`, `unknown`. Last seen: date or `unknown`. Notes: short, may be empty.
  - When a champion leaves, set Status `left` but keep Champion `yes` until a replacement is confirmed; then the old one becomes `no` and the new one `yes`.
- **Commitments** — ID: `C-001`, `C-002`, … never reused. Owner: `us` or `them`. Person: name or `unknown`. Due: date or `unknown`. Status: `open`, `done`, `dropped`. Source: `<kind> <date>`, e.g. `call 2026-09-30`. Rows in ID order.
- **Issues** — ID: tracker ID or `I-001`, … Link: URL or empty. Opened: date or `unknown`. Status: `open`, `blocked`, `resolved`.
- **Timeline** — Type: `call`, `email`, `chat`, `meeting`, `note`. Newest first.

#### Value rules

- Dates are always `YYYY-MM-DD`.
- Unknown values are the literal word `unknown` — never a guess.
- A `|` inside a cell is written `\|`.
- One line per cell.
- Empty sections keep their header row and separator row.
- Rows are never deleted — statuses change instead.

#### Blank record

```markdown
---
schema_version: 1
name: <Account name>
domains: []
channels: []
issue_tracker: null
renewal_date: null
last_contact: {}
last_refreshed: null
---

# <Account name>

## Stakeholders

| Name | Role | Champion | Status | Last seen | Notes |
| --- | --- | --- | --- | --- | --- |

## Commitments

| ID | Commitment | Owner | Person | Due | Status | Source |
| --- | --- | --- | --- | --- | --- | --- |

## Issues

| ID | Issue | Link | Opened | Status |
| --- | --- | --- | --- | --- |

## Timeline

| Date | Type | Summary |
| --- | --- | --- |
```

## File: references/source-settings.md (part of log-interaction)

### Source access settings (v1)

A condensed copy of the source access settings rules, bundled so this skill works
on its own, in a Claude Project or when served over MCP. The full spec is
`docs/source-settings.md` in the am-skills repo; if the two ever disagree, that doc
wins and this file should be updated to match.

#### What it controls

Which of the AM's connected tools you may read when updating account records.
**Everything is off until the AM turns it on.** Even when a source is allowed,
nothing is saved to a record until the AM has seen the changes and confirmed.

These settings don't connect or disconnect anything. A tool also has to be
connected to Claude (claude.ai → connectors), and disconnecting it there is the only
hard guarantee. Your job is to follow these settings exactly, every time.

#### The settings file

`account-memory-settings.md`, next to the account records. It's never an account
record. Settings are in its YAML frontmatter:

```yaml
settings_version: 1
sources:
  meeting_notes:            # meeting notetakers, e.g. Granola
    enabled: false
    only_from: []           # folder/label/channel names; empty = no extra limit
    exclude_accounts: []    # record names without .md, e.g. umbrella-labs
  email: { enabled: false, only_from: [], exclude_accounts: [] }
  calendar: { enabled: false, only_from: [], exclude_accounts: [] }
  chat: { enabled: false, only_from: [], exclude_accounts: [] }
  drive: { enabled: false, only_from: [], exclude_accounts: [] }
```

An account record can also opt itself out in its own frontmatter:
`sources: {meeting_notes: off}`. Treat `off` and `false` the same. A record can only
turn a source off, never on.

#### The rule

You may read source **S** for account **A** only when **all** of these hold:

1. The settings file exists and has `S.enabled: true`.
2. **A** isn't listed in `S.exclude_accounts`.
3. **A**'s record doesn't say `sources: {S: off}`.
4. The item is within `S.only_from` (if set) and, for email, calendar and chat,
   within **A**'s `domains` / `channels`.

- Missing or unreadable settings file, or a `settings_version` other than `1` →
  **every source is off**. Tell the AM.
- When a source is off, don't call its tool at all, not even "just to check".
  Say which condition stopped you and how to change it.
- Listing meeting titles, dates and attendees to work out which account a meeting
  belongs to is fine within `only_from`. Opening a note's content for an account
  that isn't allowed is not.
- Always report what you skipped and why.

#### Changing settings

If the AM asks you to turn a source on or off, show the change in one line, then
output the complete updated settings file for them to save, the same way you
output an updated record. Never change settings as a side effect of something else.

# Skill: portfolio-triage

**When to use it:** Answers "which of my accounts need me this week, and why" for an Account Manager, by checking every account record they have against a fixed set of rules — overdue commitments, accounts gone quiet, renewals coming up, issues left open too long, and champions who have left — and ranking the accounts with the specific reasons and one next step each. Use when the AM says things like "which accounts need me this week", "triage my portfolio", "what should I focus on today", "Monday review", "what's overdue across my accounts", "who haven't I talked to in a while", or "any renewals coming up". Do NOT use for a deep risk diagnosis of one account, preparing a specific call, QBR or renewal, or logging a conversation — those are separate skills in the health-and-risk, onboarding, qbr-and-reporting, renewals and account-memory categories.

## Portfolio Triage

You're giving an Account Manager a short, trustworthy answer to "where should I spend my time this week?" across all their accounts. Every flag you raise must come from something written in an account record. The value of this skill is that the AM can act on the list without double-checking it, so never pad it with guesses.

### Before starting

1. **Find the records.** In a Claude Project, every account record is a file like `acme-corp.md` in the Project's files. If a tool that lists or reads account records is available, use it. If the AM pasted records, use those. If there are none, say so and point them to the `log-interaction` skill to start one.
2. **Know today's date.** Every rule depends on it. Use the date you're given in the conversation; if you don't have one, ask.
3. **Check the thresholds.** Defaults are below. If the AM has said they want different ones ("flag anything quiet for a week"), use theirs and mention it in the output.

### The rules

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

### Ranking

1. Critical accounts first, then High, then Watch.
2. Within a tier, accounts with more flags come first; if that's tied, alphabetical.
3. Accounts with no flags go on a single "Fine this week" line at the end.

Use the same ranking every time so that two runs on the same records give the same order.

### Output

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

### Rules

- Every flag must point to a specific row or field in a record. If you can't point to it, it isn't a flag.
- Never fill a gap from general knowledge or by inferring from other fields.
- Count days exactly from today's date, and show the number.
- Don't change records here. If the AM says something is already done ("I sent the guide yesterday"), take it off the list for this answer and offer to log it with `log-interaction`.

### Examples

- **AM says:** "Which accounts need me this week?" → **Result:** Agent reads every record in the Project, applies the five rules against today's date, and returns the ranked list with specific reasons, one next step per account, a "Fine this week" line and any data gaps.
- **AM says:** "Anything overdue across my accounts?" → **Result:** Same check, but the output only covers the two overdue rules, ours first.
- **AM says:** "Run triage, but call it quiet after 7 days" → **Result:** Agent uses 7 days for the gone-quiet rule, says so at the top, and keeps the other defaults.

### Related skills

Diagnosing why a single account is at risk (`churn-signal-triage`), preparing a call, QBR or renewal, and logging a conversation (`log-interaction`) are separate skills. Triage points the AM at them; it doesn't do their job.

# Skill: kickoff-prep

**When to use it:** Helps an Account Manager prep for a new customer's kickoff call and the sales-to-onboarding handoff: gathers account context (from the account record if one exists), maps stakeholders, drafts a kickoff agenda, sketches a first-pass success plan, and offers to start the account's record. Use when the AM says things like "prep my kickoff call", "new customer just closed, help me onboard them", "build a success plan for [customer]", "draft the implementation handoff", or "first call with [customer] is next week". Do NOT use for ongoing health scoring or churn triage, QBR/EBR prep on an existing account, or renewal/negotiation prep — those belong to separate skills in the health-and-risk, qbr-and-reporting, and renewals categories.

## Kickoff & Onboarding Prep

You're helping an Account Manager get ready for a new customer's first 30 days: the kickoff call, the sales-to-CS handoff, and a first-draft success plan. The output should be something the AM can act on immediately — an agenda they can send, a stakeholder map they can fill gaps in, a success plan they can review with the customer — not a generic essay on onboarding best practices.

### Before starting

Ask the AM (don't guess at specifics you don't have):

1. Customer name and the plan/tier they bought.
2. What problem did they buy this to solve? (Pull from the sales handoff/CRM notes if available — see "Using a CRM tool" below.)
3. Who are the known stakeholders so far — champion, economic buyer, technical admin, exec sponsor (if enterprise)?
4. Any commitments made during the sales process (custom timelines, specific integrations, success metrics) that the AM needs to honor?
5. When is the kickoff call, and who from the customer side is confirmed to attend?

If the AM doesn't have an answer yet, note it as an open item in the output rather than inventing one — a wrong guess about a real customer is worse than a visible gap.

### Using the account record

The AM may keep a persistent record for this account: a file like `acme-corp.md` in their Claude Project, a record from a tool that reads account records, or one they paste in. **Look for it before asking anything.** If it's there:

- Read it first, and don't ask questions it already answers. Confirm what you found instead ("Your record says the renewal is 2026-12-15 — still right?").
- Before the main output, flag in a line or two anything in it that matters here: commitments of ours that are `open` and past their due date, and stakeholders marked `left` or newly added.
- For a brand-new customer there often isn't a record yet — that's normal. Anything already in it (stakeholders, commitments made during the sales cycle) seeds the stakeholder map and the handoff checklist directly.

If there's no record, say so in one line and carry on with the questions above. Never treat the record as complete: `unknown` means unknown, and something missing from the record isn't evidence either way.

### Using a CRM/CS-platform tool (optional)

See [`docs/crm-tool-calling-convention.md`](../../../docs/crm-tool-calling-convention.md) for the full convention this follows.

On top of the account record, if the AM has a CRM or CS-platform MCP tool configured, use it to pull the account record, sales notes, and contract details instead of asking for everything by hand — confirm what you found rather than re-asking questions it already answers.

If no such tool is configured (or the lookup fails), say so plainly and fall back to asking the AM directly. Never fabricate account specifics — contract value, dates, stakeholder names — to fill a gap silently.

### Workflow

#### 1. Build the stakeholder map

A lightweight table: name, role, stakeholder type (champion / economic buyer / technical admin / exec sponsor / end user), and any notes on their priorities. Flag which roles are still unknown — that's a real gap to close on the kickoff call, not something to leave implicit.

#### 2. Draft the kickoff call agenda

Standard shape, adapted to what's actually known about this account:

- Intros and roles on both sides
- Recap of why they bought and what success looks like to them (confirm, don't assume)
- Proposed timeline and milestones
- Roles and responsibilities (who does what, on both sides)
- Risks or dependencies the customer should flag early
- Next steps and the date of the next check-in

See `references/kickoff-agenda-example.md` for a fully worked example (fabricated company) if the AM wants to see the shape filled in before drafting their own.

#### 3. Draft the sales-to-CS handoff checklist

Pull together what CS/the AM needs from sales before kickoff: signed contract terms, any commitments made during the sales cycle, technical requirements gathered so far, known blockers, and the primary use case in the customer's own words. Flag anything missing as a question back to the AE, not as an assumption.

#### 4. Sketch a first-pass success plan

A 30/60/90-day skeleton tied to the reason they bought, not a generic template:

| Milestone | Target | Success signal | Owner |
|---|---|---|---|
| Kickoff complete | Day 0–7 | Stakeholders aligned, timeline agreed | AM |
| First value achieved | Day 30 | [tied to their stated use case] | AM + customer |
| Adoption milestone | Day 60 | [e.g. team onboarded, core workflow live] | Customer |
| Success review | Day 90 | Customer confirms initial goal met | AM |

Treat the "success signal" and "adoption milestone" rows as placeholders to fill from what the AM told you about this specific account — don't ship the generic labels above as the final plan.

#### 5. Offer the output in a usable format

Ask (don't assume) whether the AM wants: an internal handoff summary (email/Slack-ready), a customer-facing kickoff agenda, the success plan as a standalone doc, or all three. Draft only what's asked for.

#### 6. Offer to start or update the account record

The stakeholder map and the sales-cycle commitments are exactly what the account record is for. If there's no record yet, offer to start one with the `log-interaction` skill from what you've gathered. If there is one, offer to log anything new. Don't edit the record yourself here.

### Data safety

Everything in this skill file uses fabricated example data. In actual use, the AM will be working with real customer information — that's expected and fine, since this is a live conversation, not skill content. What's not fine: inventing specifics (names, dates, commitments) about a real account when you don't actually know them. Ask instead.

### Examples

- **AM says:** "Prep my kickoff call for Acme Corp, they signed yesterday" → **Result:** Agent asks for plan tier, known stakeholders, and the stated reason they bought; checks the CRM tool if configured; drafts a stakeholder map with gaps flagged, a kickoff agenda, and asks whether a success-plan draft is also wanted.
- **AM says:** "Build a success plan for the account we just closed" → **Result:** Agent asks which account (if not already in context), confirms the core use case and any sales-cycle commitments, then drafts the 30/60/90 skeleton with placeholders clearly marked where account-specific detail is still needed.
- **AM says:** "What do I need from sales before I take this account?" → **Result:** Agent produces the sales-to-CS handoff checklist and flags which items it doesn't yet have answers for.

### Related skills

Ongoing health scoring, churn triage, QBR prep, and renewal prep for this account are handled by separate skills (`health-and-risk`, `qbr-and-reporting`, `renewals` categories), and logging conversations into the account record is `log-interaction` (`account-memory`). Don't attempt those workflows from within this skill — hand off cleanly and say so if the AM asks for one of them here.

## File: references/kickoff-agenda-example.md (part of kickoff-prep)

### Worked example: kickoff agenda

Fabricated account, for illustration only — no real customer data.

**Account:** Acme Corp (fictional) — 40-seat plan, contract start 2026-09-01.
**Reason they bought (from sales notes):** replacing a spreadsheet-based process for tracking renewals across ~120 accounts; wants their CS team to stop missing renewal dates.
**Known stakeholders:**

| Name | Role | Type | Notes |
|---|---|---|---|
| J. Rivera | VP Customer Success | Economic buyer | Sponsored the deal, wants a dashboard for her team's pipeline |
| T. Okafor | CS Ops Lead | Champion / technical admin | Will own day-to-day configuration |
| — | End users (CSMs) | End users | Not yet identified — flag on kickoff call |

#### Agenda: Acme Corp kickoff — 2026-09-08, 30 min

1. **Intros** (5 min) — who's in the room on both sides, roles.
2. **Recap why you're here** (5 min) — confirm: replacing spreadsheet renewal tracking, goal is zero missed renewal dates within the CS team. *(Ask Acme to confirm or correct this — it's our understanding from sales, not theirs yet.)*
3. **Timeline** (5 min) — proposed: config complete by day 14, CS team onboarded by day 30, first full renewal cycle tracked by day 60.
4. **Roles and responsibilities** (5 min) — T. Okafor owns configuration on their side; who owns end-user training?
5. **Risks / dependencies** (5 min) — do they need to migrate existing spreadsheet data? Any integration with their CRM required before rollout?
6. **Next steps** (5 min) — confirm next check-in date, who sends the recap.

#### Notes

- The "end users" row is intentionally left blank — this is the kind of gap the kickoff call itself is supposed to close, not something to invent.
- Timeline numbers here are a starting proposal, not a commitment — confirm with the customer before treating them as fixed.

# Skill: churn-signal-triage

**When to use it:** Helps an Account Manager triage churn-risk signals on a single account, using the account record if one exists, work out a likely root cause, and pick a save play — not to design a company-wide health-scoring system. Use when the AM says things like "this account is going quiet", "why is Acme at risk", "why is [customer] at risk", "is this account at risk", "signs of churn on this account", "help me triage this account's health", "should I escalate this account", or "haven't heard from [customer] in weeks". Do NOT use for kickoff/onboarding prep, QBR/EBR prep, or renewal negotiation prep — those are separate skills in the onboarding, qbr-and-reporting, and renewals categories.

## Churn Signal Triage

You're helping an Account Manager figure out, right now, whether a specific account is actually at risk and what to do about it. This is a triage tool for one account in the moment — not a framework for building the company's health-scoring system, and not a substitute for the AM's own judgment about the relationship.

### Before starting

Ask the AM:

1. Which account, and what triggered the concern? (A specific event — e.g. a missed call, a usage drop the AM noticed — or a general "something feels off"?)
2. What do they already know: recent usage trend, last meaningful contact, any recent support tickets, any team/stakeholder changes on the customer side?
3. Is there a CRM/CS-platform tool configured to pull this instead of the AM reciting it from memory? (See below.)

Don't assume severity from the trigger alone — "haven't heard from them in two weeks" means something different for a self-serve SMB account than for an enterprise account with a quarterly cadence.

### Using the account record

The AM may keep a persistent record for this account: a file like `acme-corp.md` in their Claude Project, a record from a tool that reads account records, or one they paste in. **Look for it before asking anything.** If it's there:

- Read it first, and don't ask questions it already answers. Confirm what you found instead ("Your record says the renewal is 2026-12-15 — still right?").
- Before the main output, flag in a line or two anything in it that matters here: commitments of ours that are `open` and past their due date, and stakeholders marked `left` or newly added.
- Most signal categories can be read straight from the record: **Engagement** from `last_contact` and the Timeline; **Support** from Issues that are `open` or `blocked` and how long they've been open; **Relationship** from Stakeholders (a champion who `left`, or only one active contact); **Commercial** from `renewal_date`. Overdue commitments of ours count too — missed promises erode trust. The record doesn't hold usage data, so that category still comes from a CRM tool or the AM.

If there's no record, say so in one line and carry on with the questions above. Never treat the record as complete: `unknown` means unknown, and something missing from the record isn't evidence either way.

### Using a CRM/CS-platform tool (optional)

See [`docs/crm-tool-calling-convention.md`](../../../docs/crm-tool-calling-convention.md) for the full convention this follows.

On top of the account record, if a CRM/CS-platform MCP tool is configured, use it to pull usage trend, recent support tickets, and last-contact date instead of asking the AM to recall all of it. Confirm what you found rather than re-asking.

If no tool is configured, or the lookup fails, say so and ask the AM directly for what they know. Don't invent a usage trend or ticket history you don't actually have — an unverified guess presented as fact is worse than an honest "unknown."

### Workflow

#### 1. Gather signals across categories

Pull together what's known in each category — leave a category explicitly "unknown" rather than skipping it silently:

| Category | What to look for |
|---|---|
| Usage/adoption | Trending down, flat, or never ramped past initial rollout |
| Engagement | Meetings/emails going unanswered, single-threaded (one contact only) |
| Support | Ticket volume or sentiment spiking, unresolved escalations |
| Relationship | Champion left or gone quiet, no exec sponsor engagement, competitor mentioned |
| Commercial | Downgrade inquiry, questioned pricing, contract nearing end with no renewal conversation started |

#### 2. Assess rough severity

Don't manufacture a precise score — that needs real historical data this skill doesn't have. Instead, reason qualitatively:

- **1 category affected, mild** → Watch. Note it, set a follow-up, no special action yet.
- **2+ categories affected, or one severe (e.g. champion left, active competitor evaluation)** → At risk. Needs a deliberate save play this week, not just a note.
- **Imminent signal** (explicit cancellation/downgrade request, contract expiring with no engagement) → Critical. Needs escalation now, not just a play.

State your reasoning for the tier, don't just output a label — the AM needs to be able to check your logic against what they know that you don't.

#### 3. Identify the likely root cause

Match the signal pattern to a probable cause — this drives which save play makes sense. See `references/signal-to-play-reference.md` for the fuller mapping. Common patterns:

- Usage down + support quiet + champion still engaged → likely low adoption/onboarding gap, not dissatisfaction.
- Champion gone quiet + no replacement contact → relationship/stakeholder risk, not necessarily product dissatisfaction.
- Support tickets spiking + sentiment negative → product/support friction.
- Pricing questioned + usage healthy → commercial/budget pressure, not product failure.

If the signals don't clearly point to one cause, say so and suggest the AM ask directly on the next call rather than guessing.

#### 4. Recommend a save play, matched to the cause

Don't recommend a generic "check in with the customer" play when the evidence points somewhere more specific. Tie the recommendation to what was actually observed, and flag when the right move is honestly just "ask them" because the signal is ambiguous.

#### 5. Decide on escalation

Recommend looping in a manager or exec sponsor when: the tier is Critical, the account is large enough that losing it is a material risk, or the AM doesn't have the authority to make the likely concession (pricing, custom terms). Otherwise, this stays with the AM.

#### 6. Output format

Ask what's useful: a risk-flag summary for a CRM note, an internal Slack/email flag to a manager, or a draft outreach message to the customer. Draft only what's asked for, and keep the internal summary and any customer-facing draft clearly separate — they say different things.

#### 7. Offer to log what's new

If this conversation turned up anything the account record doesn't have yet (a new commitment, including any date or fix promised in a draft; a new or departed stakeholder; an issue update), list it briefly and offer to log it with the `log-interaction` skill. Don't edit the record yourself here.

### Data safety

Everything above uses fabricated example categories and reasoning, not real benchmark statistics. In actual use, the AM is working with a real account — that's expected. What's not fine: presenting an invented usage number, ticket count, or churn probability as if it were measured data. If you don't have the number, say so and ask or flag it as unknown.

### Examples

- **AM says:** "This account's gone quiet, should I be worried?" → **Result:** Agent asks what "quiet" means concretely (no replies for how long, on what channel), checks the CRM tool if configured for usage/support signals, then reasons through a tier with visible logic rather than a bare label.
- **AM says:** "Why is Acme Corp at risk?" → **Result:** Agent pulls or asks for signals across the five categories, identifies the most likely root cause pattern, and recommends a save play tied to that cause — not a generic "schedule a check-in."
- **AM says:** "Should I escalate this to my manager?" → **Result:** Agent applies the escalation criteria (tier, account size, AM's authority to act) and gives a clear yes/no with reasoning, not just "maybe, use your judgment."

### Related skills

Renewal negotiation, QBR prep, and kickoff/onboarding are separate skills (`renewals`, `qbr-and-reporting`, `onboarding` categories). Checking every account at once for who needs attention this week is `portfolio-triage`, and logging conversations is `log-interaction` (both `account-memory`). If the AM's real need is one of those, say so and don't try to cover it here.

## File: references/signal-to-play-reference.md (part of churn-signal-triage)

### Signal pattern → likely cause → save play

A starting reference, not a lookup table to apply mechanically — real accounts mix patterns. When signals are ambiguous, say so instead of forcing a fit.

| Signal pattern | Likely cause | Save play direction |
|---|---|---|
| Usage down, champion still responsive, no support complaints | Low adoption / onboarding gap | Re-onboarding push: training session, walk through unused core features, check if the original use case is even still being pursued |
| Champion gone quiet, no other contact engaged | Stakeholder / relationship risk | Multi-thread: find a second contact (their manager, an end user, the original economic buyer), don't wait on the one silent channel |
| Support tickets up, sentiment negative | Product/support friction | Direct escalation to support/product, proactive apology + resolution plan, don't just "wait for support to close the loop" |
| Pricing questioned, usage otherwise healthy | Commercial/budget pressure | ROI review showing usage value delivered, explore right-sizing (down-tier honestly, not just discount) before assuming it's a lost cause |
| Explicit competitor mention | Competitive evaluation | Understand what's missing/better elsewhere first — don't counter-pitch blind; loop in the AM's manager if the account is large |
| Contract nearing end, no renewal conversation started | Process gap, not necessarily risk | Start the renewal conversation now — this may not be "at risk" at all, just under-managed |

#### When the pattern doesn't match cleanly

If two unrelated categories are affected with no obvious connecting cause (e.g. usage is fine but pricing was questioned *and* a support ticket is open), don't force a single root-cause story. Present both threads separately and suggest the AM ask directly which one is actually driving the concern.

# Skill: renewal-prep

**When to use it:** Helps an Account Manager manage a renewal timeline and prep for the negotiation conversation on a specific account, using the account record if one exists: figures out what to do at this point in the timeline, checks whether this is a healthy renewal or a save situation, builds the value story, and preps responses to likely asks (discount, downgrade, multi-year terms). Use when the AM says things like "prep for [customer]'s renewal", "renewal coming up for [customer]", "help me negotiate this renewal", "when should I start the renewal conversation", or "[customer] wants a discount on renewal". Do NOT use for QBR prep, churn-signal triage (run that first if risk is suspected), or drafting final legal contract language — those belong to the qbr-and-reporting and health-and-risk categories, and to legal/deal-desk review, respectively.

## Renewal Timeline & Negotiation Prep

You're helping an Account Manager manage a renewal — both the timeline (what to do and when) and the negotiation conversation itself (the value story, and how to handle likely asks). This skill preps the AM's approach and talking points. It does not draft binding contract language, and it does not decide company pricing/discount policy — the AM tells you their actual authority, you don't assume it.

### Before starting

Ask the AM:

1. Which account, and how many days until renewal?
2. Is there any reason to think this is a save situation rather than a healthy renewal — a risk signal, a quiet stakeholder, a downgrade threat already raised? If the AM isn't sure, that's worth checking before going further.
3. What's the current contract (value, term length, any non-standard terms)?
4. What's the AM's actual approved flexibility — discount range, term options they can offer without escalating? Don't assume a number; ask.

### Check risk before negotiating

A renewal conversation for a healthy account and a renewal conversation for an at-risk account should not use the same script. If the AM flagged a risk signal in step 2, or if usage/engagement context (from a CRM tool, or from the AM directly) suggests one, stop and recommend running the `health-and-risk`/`churn-signal-triage` skill first. Negotiating price before understanding whether the customer is actually leaving is backwards.

### Using the account record

The AM may keep a persistent record for this account: a file like `acme-corp.md` in their Claude Project, a record from a tool that reads account records, or one they paste in. **Look for it before asking anything.** If it's there:

- Read it first, and don't ask questions it already answers. Confirm what you found instead ("Your record says the renewal is 2026-12-15 — still right?").
- Before the main output, flag in a line or two anything in it that matters here: commitments of ours that are `open` and past their due date, and stakeholders marked `left` or newly added.
- The record answers "how many days until renewal" (`renewal_date`) and feeds the risk check above: a champion marked `left`, no contact for weeks, overdue commitments of ours, or issues open for a long time are all reasons to run churn-signal triage before negotiating. Commitments `done` and issues `resolved` feed the value story. Contract value, terms and the AM's discount authority are **not** in the record — always ask for those.

If there's no record, say so in one line and carry on with the questions above. Never treat the record as complete: `unknown` means unknown, and something missing from the record isn't evidence either way.

### Using a CRM/CS-platform tool (optional)

See [`docs/crm-tool-calling-convention.md`](../../../docs/crm-tool-calling-convention.md) for the full convention this follows.

On top of the account record, if a CRM/CS-platform tool is configured, pull current contract terms, usage trend, and renewal date instead of asking the AM to recite them. Confirm what's found rather than re-asking. If not configured or the lookup fails, ask the AM directly and mark anything unknown rather than guessing at contract terms — inventing a number here isn't a minor error, it's a commercial risk.

### Workflow

#### 1. Orient on the timeline

There's no universally correct renewal cadence — company process and account size both matter, and the AM knows their own process better than this skill does. As a reasonable default to adapt, not a rule: start the conversation meaningfully before the renewal date (60-90 days out for larger accounts, less for smaller self-serve-adjacent ones), leaving room for a real back-and-forth rather than a last-week scramble. Ask the AM what their company's actual expected cadence is if they know it, and follow that instead.

#### 2. Build the value story

Similar to a QBR's ROI narrative, but framed for "why continue" rather than "look what happened this quarter": tie outcomes since the start of the contract (or since the last renewal) back to the reason they originally bought. Reuse a recent QBR's outcomes if one exists rather than re-deriving from scratch.

#### 3. Prep for likely asks

Common renewal-time asks and a reasoned way to approach each — the actual answer (what to offer) comes from the AM's stated authority in step 1, not from this skill:

- **Price increase pushback** → Lead with the value story, not a policy explanation. If there's real room to negotiate, know the floor before the call, not during it.
- **Downgrade request** → Understand why (budget, unused seats, lower usage) before countering — a downgrade conversation is sometimes an early churn signal in disguise; if it looks like one, loop back to the risk check above.
- **Multi-year ask (from either side)** → Usually needs deal-desk/finance involvement for pricing structure — flag rather than improvise terms.
- **Silence / stalling** → Don't assume disengagement means risk-free inattention; a stalled renewal this close to the date is itself a signal worth checking.

#### 4. Know when to escalate

Recommend looping in a manager, deal desk, or legal when: the ask exceeds the AM's stated authority, multi-year or custom terms are involved, or the account is large enough that the outcome is a material risk either way. This skill preps the conversation — it doesn't replace that review.

#### 5. Output format

Ask what's useful: an internal renewal-prep brief (timeline status, value story, anticipated asks and responses) for the AM's own reference, or a customer-facing renewal conversation outline/proposal email. Keep the two separate — the internal brief can name concerns plainly that shouldn't appear in anything customer-facing.

#### 6. Offer to log what's new

If this conversation turned up anything the account record doesn't have yet (a new commitment, including any date or fix promised in a draft; a new or departed stakeholder; an issue update), list it briefly and offer to log it with the `log-interaction` skill. Don't edit the record yourself here.

### Data safety

Everything above is a generic framework with fabricated placeholder language — not real contract terms, pricing policy, or negotiation benchmarks. In actual use, real contract numbers are expected in conversation; what's not fine is this skill inventing a discount percentage, contract value, or "typical" concession as if it were company policy. That number comes from the AM, every time.

### Examples

- **AM says:** "Prep for Acme Corp's renewal, it's in 75 days" → **Result:** Agent checks for risk signals first, asks for current contract terms and the AM's approved flexibility, builds the value story from known outcomes, and drafts an internal prep brief plus a proposed outreach timeline.
- **AM says:** "This customer wants a 20% discount to renew" → **Result:** Agent asks whether this looks like a risk signal or a routine negotiating opener, confirms the AM's actual discount authority before suggesting a response, and flags escalation if 20% is outside that range.
- **AM says:** "Draft the renewal contract" → **Result:** Agent declines to draft binding contract language, explains that's a legal/deal-desk task, and offers instead to prep the negotiation talking points or a proposal email summarizing agreed terms.

### Related skills

QBR prep and churn-signal triage are separate skills (`qbr-and-reporting`, `health-and-risk` categories), and logging conversations into the account record is `log-interaction` (`account-memory`). Run churn-signal triage first if there's any real doubt about account health before negotiating.

# Skill: qbr-prep

**When to use it:** Helps an Account Manager prepare a QBR/EBR for an existing account: pulls together outcomes since the last review (from the account record if one exists), builds an ROI narrative tied to why they bought, and produces a deck outline plus a one-page exec summary. Use when the AM says things like "prep my QBR for [customer]", "build a QBR deck", "help me put together an EBR", "quarterly business review for [customer]", or "exec summary for [customer]'s QBR". Do NOT use for kickoff/onboarding prep, churn-signal triage (a QBR can surface a real risk worth flagging, but triaging it is a separate skill), or renewal negotiation — those are separate skills in the onboarding, health-and-risk, and renewals categories.

## QBR / EBR Prep

You're helping an Account Manager prepare a Quarterly (or Executive) Business Review for an existing account. The goal is a review that shows the customer real outcomes tied to why they bought — not a generic usage-metrics dump. If you don't know what they were trying to achieve, ask; don't guess.

### Before starting

Ask the AM:

1. Which account, and what's the audience — the day-to-day champion, an exec sponsor, or both?
2. What period does this review cover, and is there a prior QBR or the original success plan to compare against?
3. What format is actually needed: a full deck outline, a one-page exec summary, talking points, or all three?
4. Is there anything the AM already knows is a soft spot (usage dip, unresolved issue, slow adoption) that needs careful framing rather than a surprise reveal in the meeting?

### Using the account record

The AM may keep a persistent record for this account: a file like `acme-corp.md` in their Claude Project, a record from a tool that reads account records, or one they paste in. **Look for it before asking anything.** If it's there:

- Read it first, and don't ask questions it already answers. Confirm what you found instead ("Your record says the renewal is 2026-12-15 — still right?").
- Before the main output, flag in a line or two anything in it that matters here: commitments of ours that are `open` and past their due date, and stakeholders marked `left` or newly added.
- For the review period, the record gives you most of the story: Timeline entries since the period started, commitments marked `done` (what we delivered) and still `open`, issues `resolved` versus still `open`, and stakeholder changes. Overdue commitments of ours and long-open issues are the soft spots to plan for, not hide. Usage numbers aren't in the record, so those still come from a CRM tool or the AM.

If there's no record, say so in one line and carry on with the questions above. Never treat the record as complete: `unknown` means unknown, and something missing from the record isn't evidence either way.

### Using a CRM/CS-platform tool (optional)

See [`docs/crm-tool-calling-convention.md`](../../../docs/crm-tool-calling-convention.md) for the full convention this follows.

On top of the account record, if a CRM/CS-platform tool is configured, pull usage trend, support ticket history, and (if it exists) notes from the original kickoff/success plan or a prior QBR, instead of asking the AM to reconstruct all of it. Confirm what you found.

If no tool is configured, or something can't be found, ask the AM directly and note it as unknown rather than inventing a trend or number to fill the gap.

### Workflow

#### 1. Gather outcomes since the last review

Pull together, per what's actually known: usage/adoption trend, milestones hit against the original success plan (if one exists — see the `onboarding`/`kickoff-prep` skill), notable support history, and any team or stakeholder changes on the customer side. Mark anything unknown rather than skipping it silently.

#### 2. Build the ROI narrative

Tie outcomes back to the reason they bought, not to metrics for their own sake. "Usage is up 20%" means nothing on its own — "usage is up because the team you said needed to adopt this now has, and that's the outcome you told us mattered" is the actual narrative. If the original reason they bought isn't known, ask before writing generic ROI language.

#### 3. Structure the review

Standard shape, trim to what's actually relevant for this account:

- Recap: what were we trying to achieve, and what's changed since the last review
- Outcomes and wins, tied to the ROI narrative above
- Usage/adoption summary — enough to support the narrative, not a raw data dump
- Open items or challenges — name them plainly, don't bury a real issue in a "looking ahead" slide
- What's next — roadmap relevant to this customer, upcoming milestones
- The ask — what does the AM actually want from this meeting? (Renewal alignment, expansion interest, an advocacy ask, exec sponsor engagement?) A QBR without a clear ask is a status update, not a business review.

See `assets/qbr-deck-outline.md` for a fillable template following this structure.

#### 4. Draft the one-page exec summary

For a sponsor who won't sit through the full deck: the headline outcome, one supporting number, the single most important open item (if any), and the ask. Keep it to what an exec actually needs to make a decision or give air cover — not a condensed version of every slide.

#### 5. Flag internal risks before the meeting

If gathering outcomes surfaced something concerning (usage dropped, a stakeholder went quiet, a support pattern looks bad), say so plainly to the AM — but don't run a full risk triage here. If it looks like a real concern, suggest the AM follow up with the `health-and-risk`/`churn-signal-triage` skill separately rather than folding that analysis into the QBR prep.

#### 6. Output format

Produce only what was asked for in step 1 — deck outline, exec summary, talking points, or a combination.

#### 7. Offer to log what's new

If this conversation turned up anything the account record doesn't have yet (a new commitment, including any date or fix promised in a draft; a new or departed stakeholder; an issue update), list it briefly and offer to log it with the `log-interaction` skill. Don't edit the record yourself here.

### Data safety

Everything above uses fabricated placeholder language, not real account data or invented metrics. In actual use the AM is working with a real account — expected. What's not fine: presenting a made-up usage number, ROI figure, or outcome as if it were verified. If you don't have it, ask or mark it unknown.

### Examples

- **AM says:** "Prep my QBR for Acme Corp, it's next Tuesday" → **Result:** Agent asks for audience and format, pulls or asks for outcomes since the last review, confirms the original reason they bought before drafting ROI language, and produces a deck outline via the template.
- **AM says:** "I need a one-pager for the exec sponsor" → **Result:** Agent drafts the headline outcome, one supporting number, the most important open item if any, and a clear ask — not a shrunk version of the full deck.
- **AM says:** "Usage has actually dropped for this account, what do I do for the QBR?" → **Result:** Agent flags this plainly, suggests framing it honestly in the review rather than hiding it, and recommends the AM run churn-signal-triage separately if it looks like a real risk rather than trying to resolve it inside the QBR prep.

### Related skills

Kickoff/onboarding, churn-signal triage, and renewal negotiation are separate skills (`onboarding`, `health-and-risk`, `renewals` categories), and logging conversations into the account record is `log-interaction` (`account-memory`). If a QBR conversation surfaces a real risk or turns into renewal negotiation, hand off rather than trying to cover it here.

## File: assets/qbr-deck-outline.md (part of qbr-prep)

### QBR/EBR Deck Outline — [Customer Name], [Quarter/Period]

Fill in each section from what's actually known about this account. Leave a section explicitly marked "TBD" rather than inventing content to fill it.

#### 1. Recap
- What we set out to achieve together (from the original success plan or last review)
- What's changed since then, in one line

#### 2. Outcomes & Wins
- [Outcome 1] — tied to the original goal, not a raw metric
- [Outcome 2]
- (Add more only if genuinely notable — a padded list dilutes the real wins)

#### 3. Usage & Adoption Summary
- Trend since last review: [up / flat / down] — [why, if known]
- Supporting detail only as needed to back the narrative above

#### 4. Open Items / Challenges
- [Issue] — named plainly, with current status and owner
- Don't bury a real issue in "looking ahead" — name it here

#### 5. What's Next
- Roadmap items relevant to this customer specifically
- Upcoming milestones on their side (e.g. team expansion, new use case)

#### 6. The Ask
- What does the AM want from this meeting: renewal alignment / expansion interest / advocacy ask / exec engagement / other
- Be specific — "let's stay in touch" is not an ask

---

#### One-page exec summary (separate artifact, same account)

- **Headline outcome:** [the one thing that matters most]
- **Supporting number:** [one metric, tied to the headline]
- **Most important open item, if any:** [plain statement]
- **The ask:** [same as section 6 above, condensed]

# Skill: escalation-email-drafting

**When to use it:** Helps an Account Manager draft escalation and stakeholder emails when something's off track, grounded in the account record if one exists: a customer-facing issue/delay notice, an apology, an internal ask for exec or cross-functional help, or a stakeholder status update. Use when the AM says things like "draft an escalation email for [customer]", "write an internal escalation to get help on this account", "how do I tell [customer] about this delay", "draft an apology email", or "loop in my manager on this account issue". Do NOT use for QBR exec summaries, renewal proposal emails, routine kickoff agendas, or deciding how severe a risk is (run churn-signal-triage first if that hasn't been done) — those belong to the qbr-and-reporting, renewals, onboarding, and health-and-risk categories.

## Escalation & Stakeholder Email Drafting

You're helping an Account Manager draft a message for a situation that's off track — not a routine update. This skill produces a draft for the AM to review and send themselves; it never claims to have sent anything, and it flags when something needs legal/comms sign-off before it goes out.

### Before starting

Ask the AM:

1. Who's this for — the customer directly, a customer exec, an internal manager, or a cross-functional team (support/product/legal)?
2. What actually happened? Get the facts plainly — don't let the AM (or yourself) soften what went wrong before drafting; you can control tone without hiding substance.
3. What's the ask or the goal of this message — an apology plus a fix timeline, an internal request for help, or just keeping people informed?
4. Any constraints — is this the kind of thing (SLA breach, data incident, anything with financial/contractual weight) that needs legal or comms review before it's sent?

If this is really a question of *how bad is this* rather than *how do I say it*, and the AM hasn't already assessed that, suggest running `health-and-risk`/`churn-signal-triage` first — this skill drafts the message, it doesn't decide the severity.

### Using the account record

The AM may keep a persistent record for this account: a file like `acme-corp.md` in their Claude Project, a record from a tool that reads account records, or one they paste in. **Look for it before asking anything.** If it's there:

- Read it first, and don't ask questions it already answers. Confirm what you found instead ("Your record says the renewal is 2026-12-15 — still right?").
- Before the main output, flag in a line or two anything in it that matters here: commitments of ours that are `open` and past their due date, and stakeholders marked `left` or newly added.
- Use it for the facts and the audience: the relevant Issue row (ID, how long it's been open, status) and recent Timeline entries for what happened; open commitments for what's already been promised; active Stakeholders for who to address. Never address someone marked `left`.

If there's no record, say so in one line and carry on with the questions above. Never treat the record as complete: `unknown` means unknown, and something missing from the record isn't evidence either way.

### Message types

#### Customer-facing issue notice or apology

Acknowledge what happened plainly — don't bury it in caveats or hedge it into vagueness. State: what happened (factually, without over-explaining internal root cause unless the customer needs it), what's being done, a concrete timeline, and who the customer's point of contact is for updates. Match tone to severity: a minor delay doesn't need an apology-heavy tone, and a real failure shouldn't be minimized with a breezy one.

**Flag before drafting further** if the situation involves an SLA breach, a data/security incident, or anything with contractual or financial implications — that needs legal/comms review before anything goes to the customer, and this skill should say so rather than draft around it.

#### Internal escalation ask

State: the account and why it matters (business impact — e.g. renewal timing, churn risk, deal size), the specific ask (what you need, from whom, by when), and what's already been tried (so the reader isn't sent back to first-line troubleshooting). A vague "can someone help with this account" is not an escalation, it's a shrug — make the ask concrete.

#### Stakeholder status update

Lead with the headline status, not a chronological narrative — the reader should know where things stand from the first line. Keep it neutral, and be explicit about whether any action is needed from the recipient or this is purely informational.

### Workflow

1. Identify the message type (above) from what the AM describes — ask if it's ambiguous.
2. Gather the facts plainly (don't let severity get softened at the fact-gathering stage — tone is a drafting choice, not a fact-gathering one).
3. Flag if legal/comms review looks warranted, before spending effort on a full draft.
4. Draft the message, matching structure to the type above.
5. Ask whether a companion piece is also needed — e.g. a customer-facing notice plus an internal heads-up to the AM's manager about the same situation. Draft only what's asked for.
6. If this conversation turned up anything the account record doesn't have yet (a new commitment, including any date or fix promised in a draft; a new or departed stakeholder; an issue update), list it briefly and offer to log it with the `log-interaction` skill. Don't edit the record yourself here. A fix date promised in a customer-facing draft is a new commitment of ours once the AM sends it.

### Data safety

Everything above uses fabricated placeholder situations, not real incident details. In actual use, the AM is working with a real situation — that's expected. What's not fine: this skill inventing facts about what happened, promising a specific fix timeline the AM didn't confirm, or making a commitment on the company's behalf. Draft only what the AM has actually told you; flag anything that reads like an unconfirmed promise before finalizing.

### Examples

- **AM says:** "Draft an escalation email for Acme Corp, we missed their go-live date" → **Result:** Agent gathers what actually happened and the current fix timeline, asks whether this needs legal/comms review, then drafts a plain acknowledgment with the timeline and point of contact — no invented root-cause explanation, no over-apologizing.
- **AM says:** "I need to get my manager's attention on this account, support isn't responding fast enough" → **Result:** Agent drafts an internal escalation with the business-impact reason, the specific ask (e.g. "need a P1 response within 24 hours"), and what's already been tried — not a vague "please help."
- **AM says:** "Write an update for the customer's stakeholders on where we are" → **Result:** Agent asks whether this is a healthy update or something more serious; if serious and severity hasn't been assessed, suggests churn-signal-triage first; otherwise drafts a status-first, neutral update.

### Related skills

QBR exec summaries, renewal proposals, kickoff agendas, and churn-risk assessment are separate skills (`qbr-and-reporting`, `renewals`, `onboarding`, `health-and-risk` categories), and logging conversations into the account record is `log-interaction` (`account-memory`). This skill only drafts the message once the underlying situation and severity are already understood.
