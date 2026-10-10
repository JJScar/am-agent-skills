---
name: log-interaction
description: >-
  Updates an Account Manager's persistent account record from a call
  transcript, call notes, email thread or chat export — pasted in, or pulled
  from a connected meeting notetaker such as Granola when the AM has allowed
  it in their settings. It pulls out new
  commitments (ours and theirs), stakeholder changes, issues and a timeline
  entry, shows the changes for the AM to confirm, then produces the updated
  record. Use when the AM says things like "log this call", "update Acme's
  record", "here's the transcript from today", "add this email thread to the
  account", "what did we just agree to", "track what I promised them", or
  pastes a conversation and asks to save it, or says "log today's Acme
  call", "pull my Granola notes for Acme", or "log all my calls from this
  week". Do NOT use for preparing a call,
  QBR or renewal, triaging which accounts need attention, or drafting a reply
  to the customer — those are separate skills in the onboarding,
  qbr-and-reporting, renewals, communication and account-memory categories.
metadata:
  version: 1.1.0
  author: JJScar
  audience: non-technical
---

# Log Interaction

You're keeping an Account Manager's account memory up to date. They give you a conversation with a customer — a call transcript, their own rough call notes, an email thread, or a Slack/Telegram export — or ask you to fetch it from their meeting notetaker, and you turn it into changes to that account's record: what was promised, who's involved, what's broken, and what happened. The AM confirms the changes before anything is saved.

The record format is fixed. It's described in full in `references/record-format.md` — read that before writing a record for the first time in a conversation. Getting the format exactly right matters: the same file is read later by triage and prep skills, and eventually by software.

## Before starting

1. **Which account?** Work it out from the conversation (company name, email domains, channel name). If it's ambiguous, ask.
2. **Find the current record.** In a Claude Project, look for the account's file in the Project's files (named like `acme-corp.md`). If the AM pasted the record, use that. If there's a tool available that reads account records, use it.
   - If there's no record yet, offer to start one. Ask only for the account name; everything else can be filled in from the conversation or left empty.
   - If two files could match, ask which one.
3. **What kind of interaction, and when?** (For notes fetched from a notetaker, the meeting date and attendees come with it.) `call`, `email`, `chat`, `meeting` or `note`, and the date it happened. Email and chat exports usually carry dates. For transcripts and notes, ask "Was this today?" rather than assuming.
4. **Who is "us"?** Commitments are owned by `us` (the AM's company) or `them` (the customer). Use the record's stakeholders and email domains to tell the sides apart. If a speaker's side is unclear, ask — don't guess who owes what.

## Getting the conversation from a notetaker

When the AM asks you to log a call without pasting anything ("log today's Acme call", "pull my Granola notes"), you may fetch it from a connected meeting notetaker, **but only if their settings allow it**. The full rules are in `references/source-settings.md`; read it the first time this comes up in a conversation.

1. **Check the settings.** Find `account-memory-settings.md` in the Project files (or via a tool that reads it). Meeting notes may be read for this account only if `meeting_notes.enabled` is `true`, the account isn't in `exclude_accounts`, and the account's record doesn't say `sources: {meeting_notes: off}`.
   - Settings file missing or unreadable → treat it as off.
   - If it's off, **don't call the notetaker at all**, even if it's connected. Say which rule stopped you and how to change it ("Meeting notes are off in your settings — set `enabled: true` under `meeting_notes` to allow this"), then offer to work from a paste instead.
2. **Find the notetaker.** Look through your available tools for one that searches or reads meeting notes or transcripts (Granola, or similar), judging by its name and description, never by a fixed tool name. If there isn't one, say so ("No meeting-notes tool is connected — you can add Granola in claude.ai under connectors") and ask for a paste.
3. **List, then pick.** Search only within `only_from` folders if any are set. Look at meetings since the last `call` or `meeting` in the record's Timeline (or the last 14 days if there isn't one). Match them to the account by attendee email domains against the record's `domains` first, then by the account or stakeholder names in the title. Show the AM the matches (title, date, attendees) and get them to confirm which to log **before** opening any note in full. If a match is uncertain, ask; don't guess.
4. **Read and log.** Open only the confirmed notes, prefer the full transcript where the notetaker provides one, then follow the normal workflow below. The interaction type is `call` (or `meeting` if it was in person), and the Source is the notetaker plus date, e.g. `granola 2026-10-08`.

**Several calls at once** ("log all my calls from this week"): list that period's meetings, group them by matched account, and handle each account separately with its own preview and confirm. For accounts that aren't allowed, don't open their notes; list them as skipped with the reason. Meetings that match no account get listed for the AM to assign or ignore.

Always end with a one-line summary of what you skipped and why, so the AM can see their settings working: "Skipped 1 meeting: Umbrella Labs (meeting notes turned off in its record)."

## Workflow

### 1. Extract

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

### 2. Show the changes

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

### 3. Apply

Only after the AM confirms (or after you've made their corrections and they've confirmed again):

- **If a tool for saving account records is available**, use it. Show the grouped changes above first anyway, even if the tool has its own preview step.
- **Otherwise**, output the **complete updated record** as one markdown code block — never a partial snippet — and tell the AM how to save it: in a Claude Project, replace the account's file with this version (download or copy it, remove the old file, add the new one).

### 4. Close

One or two lines: what changed, and anything worth acting on now — for example, a commitment of ours due in the next few days, or "Marco has left and nobody has replaced him as champion".

## Rules

- **Never delete rows.** Departed people become `left`, finished commitments become `done` or `dropped`, fixed issues become `resolved`.
- **Never invent** a date, an owner, a person or a role. Use `unknown` and, if it matters, ask.
- **IDs are never reused.** New commitment IDs continue from the highest existing one.
- **Stick to the record format exactly** — same sections in the same order, same columns, `YYYY-MM-DD` dates, one line per cell.
- **Keep it about the account.** Don't log personal, health or HR details about individuals even if they come up in the conversation. "Out on leave until November" is fine; the reason is not.
- If the conversation contains nothing worth logging, say so and don't produce a record.

## Examples

- **AM says:** "Log this call with Acme" and pastes a transcript → **Result:** Agent finds `acme-corp.md`, asks whether the call was today, shows the grouped changes with quoted evidence for each new commitment and a short "Needs your call" list, then after "confirm" outputs the full updated record and how to save it.
- **AM says:** "Here's the email thread with Globex, what did we just agree to?" → **Result:** Agent answers the question from the thread, then offers to log it — and does so only if the AM says yes.
- **AM says:** "Add this to the record — I promised Dana the migration guide by Friday" → **Result:** Agent treats the AM's own sentence as a `note`, works out Friday's date, proposes one new `us` commitment and a timeline entry, and confirms before producing the record.

## Related skills

Preparing for a call, QBR or renewal, triaging which accounts need attention this week, and drafting replies to the customer are separate skills. If that's what the AM actually wants, say so and offer to log the interaction afterwards instead.
