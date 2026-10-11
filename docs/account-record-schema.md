# Account record schema

Resolved by AM-031, per DEC-5 (see
[`account-memory-decision.md`](account-memory-decision.md)). This is the one format
for an account record, used unchanged in every phase: Claude reads and edits it
directly inside a Claude Project (Phase A), and the MCP server parses and writes it
(Phase B onward). Anything that reads or writes records must follow this doc.

A complete, fabricated example lives at
[`examples/account-records/acme-corp.md`](../examples/account-records/acme-corp.md).

## Files

- **One markdown file per account**, named after the account in kebab-case:
  `acme-corp.md`. The filename is the account's ID — don't rename it once other
  things refer to it.
- `account-memory-settings.md` is a reserved filename for the AM's source access
  settings ([`source-settings.md`](source-settings.md)). It's never an account record,
  and anything listing records skips it.
- Real records **never live in this repo**. They stay in the AM's Claude Project or
  their own data folder. Repo examples use fabricated companies, people and
  `.example` domains only.

## Shape

```
---
<frontmatter>
---

# <Account name>

## Stakeholders
<table>

## Commitments
<table>

## Issues
<table>

## Timeline
<table>

## Notes
<free text, optional>
```

The four table sections are **required and always appear in this order**, even when
empty (an empty section keeps its header row). `## Notes` is optional and is the only
place free prose goes. No other `##` headings.

## Frontmatter

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `schema_version` | integer | yes | Always `1` for this version of the format. |
| `name` | string | yes | The account's display name, e.g. `Acme Corp`. Matches the `#` heading. |
| `domains` | list of strings | yes (may be `[]`) | Email domains the customer uses. Used to find their emails. |
| `channels` | list of `{type, name}` | yes (may be `[]`) | Shared chat channels. `type` is `slack`, `telegram`, `teams`, `discord` or `other`; `name` is the channel as it appears in that tool. |
| `issue_tracker` | `{system, key}` or `null` | yes | Where their engineering issues live. `system` is `jira`, `linear`, `github` or `other`; `key` is the project key/repo, e.g. `ACME`. |
| `renewal_date` | date or `null` | yes | Next renewal date. |
| `last_contact` | map | yes (may be `{}`) | Most recent contact per kind: keys `email`, `call`, `chat`, each a date. Omit a key if there's never been contact that way. |
| `last_refreshed` | date or `null` | yes | When the record was last checked against the AM's connected tools (Gmail, Slack, …). `null` until the first refresh. |
| `sources` | map | no | Per-account opt-out from connected sources, e.g. `{meeting_notes: off}`. Only `off` is allowed. See [`source-settings.md`](source-settings.md). |

`domains`, `channels` and `issue_tracker` together are the account's **source
mapping**: they tell Claude where to look for new activity on this account.

## Tables

### Stakeholders

| Column | Values |
| --- | --- |
| Name | Full name. |
| Role | Job title or role on the account. |
| Champion | `yes` or `no`. At most one active champion at a time. |
| Status | `active`, `left` or `unknown`. Use `left` when someone leaves the company or the account — don't delete the row. |
| Last seen | Date of the last interaction with them, or `unknown`. |
| Notes | Short free text, may be empty. |

When a champion leaves: set their Status to `left` and **keep Champion as `yes`**
until someone replaces them. Then set the old champion to `no` and the new one to
`yes`. A row with Champion `yes` and Status `left` therefore always means "our
champion is gone and nobody has replaced them yet".

### Commitments

| Column | Values |
| --- | --- |
| ID | `C-001`, `C-002`, … — sequential per account, never reused. |
| Commitment | What was promised, in one line. |
| Owner | `us` (we owe the customer) or `them` (the customer owes us). |
| Person | Who specifically, or `unknown`. |
| Due | Date, or `unknown`. Never guess one. |
| Status | `open`, `done` or `dropped`. |
| Source | Where it came from: `<kind> <date>`, e.g. `call 2026-09-30`, `slack 2026-10-08`. |

Rows are in ID order. Completed commitments stay in the table with `done` — they're
the history of what we delivered.

### Issues

| Column | Values |
| --- | --- |
| ID | The tracker's ID (`ACME-142`), or `I-001`, `I-002`, … if it isn't tracked anywhere. |
| Issue | One-line title. |
| Link | URL, or empty. |
| Opened | Date it was opened, or `unknown`. |
| Status | `open`, `blocked` or `resolved`. |

Resolved issues stay in the table so the record shows what's been fixed.

### Timeline

| Column | Values |
| --- | --- |
| Date | Date of the interaction. |
| Type | `call`, `email`, `chat`, `meeting` or `note`. |
| Summary | One or two sentences: what happened and what was agreed. |

Newest first. Add an entry for every logged interaction.

## Value rules

- **Dates** are always `YYYY-MM-DD`.
- **Unknown values** are the literal word `unknown` — never a guess, never left
  blank in a column that has a defined value set. Optional free-text columns
  (Notes, Link) may be empty.
- **Pipes** inside a cell are written `\|` so they don't break the table.
- One cell, one line — no line breaks inside a cell.

## What reads these rules

- **Triage** (AM-034 / AM-042) flags: open `us` commitments past their due date; no
  contact (latest `last_contact`) for more than 14 days; `renewal_date` within 90
  days; an `open` or `blocked` issue opened more than 21 days ago; a Champion `yes`
  row with Status `left`.
- **Logging an interaction** (AM-032 / AM-041) adds timeline rows and new commitment
  IDs, updates stakeholder Last seen and `last_contact`, and never deletes rows.

## How the server reads records

From Phase B, the MCP server reads and writes these files itself
(`mcp-server/account-store.mjs`), from a data folder on the server's machine:
`AM_SKILLS_DATA_DIR`, default `~/am-skills-data/`, always outside the repo. Files are
written with owner-only permissions. It treats two kinds of mistakes differently:

- **Structure problems stop the record from being read:** bad frontmatter YAML, a
  missing, unknown or out-of-order section, table columns that don't match this doc,
  a row with the wrong number of cells, or stray text inside a table section. The
  error names the file, the section and the line, so it can be fixed by hand.
- **Value problems are reported but don't hide the account:** a malformed date, a
  status outside the allowed values, two active champions, or a duplicate ID. The
  account still shows up (for example in triage) with its problems listed. The server
  won't save a record until they're fixed.

Spacing inside tables is forgiving (`|C-001|  text |` reads fine) and is tidied to the
canonical layout on the next save. Frontmatter you didn't change is written back
exactly as it was. The server never overwrites a file that changed on disk after it
read it, for example if you edited the file by hand in the meantime.


A condensed copy of this doc is bundled with the `log-interaction` skill at
`skills/account-memory/log-interaction/references/record-format.md`, so the skill
works without the rest of the repo. Update it in the same change as this doc.

Bump `schema_version` for any change that would make an existing record invalid
(renamed or removed columns, new required fields), and say how to migrate old
records. Adding an optional frontmatter field doesn't need a bump.

## Blank record

Copy this to start a new account:

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
