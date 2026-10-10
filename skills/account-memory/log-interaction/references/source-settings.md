# Source access settings (v1)

A condensed copy of the source access settings rules, bundled so this skill works
on its own, in a Claude Project or when served over MCP. The full spec is
`docs/source-settings.md` in the am-skills repo; if the two ever disagree, that doc
wins and this file should be updated to match.

## What it controls

Which of the AM's connected tools you may read when updating account records.
**Everything is off until the AM turns it on.** Even when a source is allowed,
nothing is saved to a record until the AM has seen the changes and confirmed.

These settings don't connect or disconnect anything. A tool also has to be
connected to Claude (claude.ai → connectors), and disconnecting it there is the only
hard guarantee. Your job is to follow these settings exactly, every time.

## The settings file

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

## The rule

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

## Changing settings

If the AM asks you to turn a source on or off, show the change in one line, then
output the complete updated settings file for them to save, the same way you
output an updated record. Never change settings as a side effect of something else.
