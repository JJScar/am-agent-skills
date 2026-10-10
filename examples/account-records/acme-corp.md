---
schema_version: 1
name: Acme Corp
domains:
  - acme.example
  - acme-labs.example
channels:
  - type: slack
    name: "#ext-acme"
  - type: telegram
    name: Acme x Vendor Support
issue_tracker:
  system: jira
  key: ACME
renewal_date: 2026-12-15
last_contact:
  email: 2026-10-06
  call: 2026-09-30
  chat: 2026-10-08
last_refreshed: 2026-10-08
---

# Acme Corp

## Stakeholders

| Name | Role | Champion | Status | Last seen | Notes |
| --- | --- | --- | --- | --- | --- |
| Dana Whitfield | VP Engineering | no | active | 2026-09-30 | Economic buyer; signs the renewal |
| Priya Raman | Staff Engineer, Platform | yes | active | 2026-10-08 | New champion since Marco left; very responsive in Slack |
| Marco Lindqvist | Head of Platform | no | left | 2026-08-14 | Former champion; left Acme in August |
| Sam Okafor | Procurement Lead | no | active | unknown | Named on the original contract; not yet met |

## Commitments

| ID | Commitment | Owner | Person | Due | Status | Source |
| --- | --- | --- | --- | --- | --- | --- |
| C-001 | Send the Q3 usage summary | us | Account manager | 2026-09-20 | done | call 2026-09-12 |
| C-002 | Share the migration guide for the v4 API | us | Account manager | 2026-10-03 | open | call 2026-09-30 |
| C-003 | Get an engineering ETA on the webhook retry bug (ACME-142) | us | Account manager | 2026-10-14 | open | slack 2026-10-08 |
| C-004 | Confirm attendees for the December renewal review | them | Dana Whitfield | 2026-10-31 | open | email 2026-10-06 |
| C-005 | Run a pilot of the new audit-log export | them | Priya Raman | unknown | open | call 2026-09-30 |

## Issues

| ID | Issue | Link | Opened | Status |
| --- | --- | --- | --- | --- |
| ACME-142 | Webhook retries drop events under load | https://jira.example/browse/ACME-142 | 2026-09-02 | open |
| ACME-151 | SSO login loop on Safari | https://jira.example/browse/ACME-151 | 2026-09-25 | blocked |
| ACME-118 | Rate-limit headers missing on bulk endpoint | https://jira.example/browse/ACME-118 | 2026-07-10 | resolved |

## Timeline

| Date | Type | Summary |
| --- | --- | --- |
| 2026-10-08 | chat | Priya chased ACME-142 in #ext-acme; promised her an engineering ETA by 14 Oct |
| 2026-10-06 | email | Dana asked to schedule the December renewal review; she'll confirm attendees |
| 2026-09-30 | call | Monthly sync with Dana and Priya: v4 migration questions, audit-log export pilot agreed |
| 2026-09-12 | call | Q3 check-in; agreed to send a usage summary |
| 2026-08-14 | email | Marco announced he's leaving Acme; introduced Priya as the new platform contact |

## Notes

Acme is mid-way through moving to the v4 API. Dana cares most about reliability
before the renewal, so ACME-142 is the thing to close out before December.
