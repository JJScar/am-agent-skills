# Account record format (v1)

A condensed copy of the account record format, bundled so this skill works on its
own — in a Claude Project or when served over MCP — without access to the rest of
the repo. The full spec is `docs/account-record-schema.md` in the am-skills repo;
if the two ever disagree, that doc wins and this file should be updated to match.

## Shape

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

## Frontmatter fields

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

## Column values

- **Stakeholders** — Champion: `yes`/`no` (at most one active champion). Status: `active`, `left`, `unknown`. Last seen: date or `unknown`. Notes: short, may be empty.
  - When a champion leaves, set Status `left` but keep Champion `yes` until a replacement is confirmed; then the old one becomes `no` and the new one `yes`.
- **Commitments** — ID: `C-001`, `C-002`, … never reused. Owner: `us` or `them`. Person: name or `unknown`. Due: date or `unknown`. Status: `open`, `done`, `dropped`. Source: `<kind> <date>`, e.g. `call 2026-09-30`. Rows in ID order.
- **Issues** — ID: tracker ID or `I-001`, … Link: URL or empty. Opened: date or `unknown`. Status: `open`, `blocked`, `resolved`.
- **Timeline** — Type: `call`, `email`, `chat`, `meeting`, `note`. Newest first.

## Value rules

- Dates are always `YYYY-MM-DD`.
- Unknown values are the literal word `unknown` — never a guess.
- A `|` inside a cell is written `\|`.
- One line per cell.
- Empty sections keep their header row and separator row.
- Rows are never deleted — statuses change instead.

## Blank record

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
