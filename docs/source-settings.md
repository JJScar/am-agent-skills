# Source access settings

Resolved by AM-053, per DEC-9 (see
[`account-memory-decision.md`](account-memory-decision.md)). This defines how an
Account Manager controls which of their connected tools Claude may read when it
updates account records: meeting notes (e.g. Granola), email, calendar, chat and
documents. **Everything is off until the AM turns it on.**

A fabricated example lives at
[`examples/account-memory-settings.md`](../examples/account-memory-settings.md).

## Two levels of control

1. **The connector itself — the hard switch.** Whether a tool such as Granola or
   Gmail is connected to Claude at all, and what that vendor lets it see (e.g. which
   Granola folders are shared), is set in claude.ai and in the vendor's own
   settings. Disconnecting a connector is the only way to *guarantee* Claude can't
   read it. Our settings can't override this, and don't try to.
2. **These settings — what account memory is allowed to use.** Even when a
   connector is connected, the account-memory skills only read from a source when
   these settings allow it, for that account. In a Claude Project (Phase A) this is
   a rule the skills follow; from Phase B onward the MCP server also enforces it and
   refuses to save anything from a source that isn't allowed (AM-055).

Whatever the source, nothing is saved to a record until the AM has seen the
proposed changes and confirmed them.

## The settings file

One file named exactly **`account-memory-settings.md`**, kept next to the account
records: in the Claude Project's files (Phase A) or in the data folder (Phase B).
This filename is reserved: no account record may use it, and anything that lists
account records skips it.

It's a markdown file so a non-technical AM can open and edit it like any other
file. The settings are in the frontmatter at the top; the body is a plain-language
explanation for whoever opens it.

### Sources

| Key | What it covers | Examples |
| --- | --- | --- |
| `meeting_notes` | Notes and transcripts from a meeting notetaker | Granola |
| `email` | Email threads | Gmail |
| `calendar` | Meetings and attendees | Google Calendar |
| `chat` | Shared customer channels | Slack, Telegram |
| `drive` | Documents | Google Drive |

### Per-source fields

| Field | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | `true` lets the account-memory skills read this source. |
| `only_from` | `[]` | Optional limit: names of folders, labels or channels that may be read, e.g. a Granola folder `Customer calls`. Empty means no extra limit beyond what the connector itself shares. |
| `exclude_accounts` | `[]` | Account record names (the filename without `.md`, e.g. `umbrella-labs`) that must never be read about from this source. |

Email, calendar and chat reads are also always limited to the account's own source
mapping in its record (`domains`, `channels`): settings never widen that.

### Per-account opt-out

An account record can opt itself out in its own frontmatter, which is handy for a
sensitive account:

```yaml
sources:
  meeting_notes: off
  email: off
```

The only allowed value is `off`. A record can't turn on a source that the settings
file has turned off. Some YAML readers treat a bare `off` as the boolean `false`, so
anything that reads records must treat `off` and `false` the same.

## The rule

Claude may read source **S** for account **A** only when **all** of these hold:

1. The settings file exists and has `S.enabled: true`.
2. **A** isn't listed in `S.exclude_accounts`.
3. **A**'s record doesn't say `sources: {S: off}`.
4. The item is within `S.only_from` (if set) and, for email, calendar and chat,
   within **A**'s source mapping.

If the settings file is missing, unreadable or has an unknown `settings_version`,
treat **every source as off** and tell the AM, never assume. When a source is off,
say so and explain how to turn it on; never read it "just this once".

Skills report what they skipped, so the AM can see the setting working: "Skipped
email (off in your settings)".

## Changing settings

- **By hand:** open the file and change `false` to `true` (or back). That's it.
- **By asking Claude:** "Turn on Granola for my meeting notes." Claude shows the
  change and produces the full updated file to save, the same confirm-then-save
  pattern as `log-interaction`. From Phase B, the server's settings tool does this
  with the same confirm step and keeps a change log (AM-055).

## Bundled copy

A condensed copy of this doc is bundled with the `log-interaction` skill at
`skills/account-memory/log-interaction/references/source-settings.md`, so the skill
works without the rest of the repo. Update it in the same change as this doc.

## Versioning

`settings_version` is `1`. Bump it for any change that would make an existing file
mean something different; adding a new source key with `enabled: false` doesn't
need a bump.

## Default file

New setups start from this. Every source is off.

```markdown
---
settings_version: 1
sources:
  meeting_notes:
    enabled: false
    only_from: []
    exclude_accounts: []
  email:
    enabled: false
    only_from: []
    exclude_accounts: []
  calendar:
    enabled: false
    only_from: []
    exclude_accounts: []
  chat:
    enabled: false
    only_from: []
    exclude_accounts: []
  drive:
    enabled: false
    only_from: []
    exclude_accounts: []
---

# Account memory settings

This file controls which of your connected tools Claude may read when it updates
your account records. Everything starts **off**.

- To let Claude read a source, change its `enabled: false` to `enabled: true`.
- To limit it to certain folders, labels or channels, list them under `only_from`,
  e.g. `only_from: ["Customer calls"]`.
- To keep an account out of a source completely, add its file name (without `.md`)
  under `exclude_accounts`, e.g. `exclude_accounts: ["acme-corp"]`.

Turning a source on here doesn't connect anything: the tool also has to be
connected to Claude (in claude.ai, under connectors). Disconnecting it there is the
surest way to stop Claude reading it. Nothing is ever saved to an account record
until you've seen the changes and said yes.
```
