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
