---
name: example-crm-lookup-skill
description: >-
  DEMO ONLY — not a real catalog skill. Illustrates the calling convention from
  docs/crm-tool-calling-convention.md: how a skill should check for a configured
  CRM/CS-platform MCP tool, call it for account context, and gracefully fall back
  to asking the AM directly if the tool is absent or the lookup fails. Use when
  you want a worked example of the convention, e.g. while writing a new technical
  skill that needs live account data. Do NOT use for real account work — this
  file is intentionally excluded from skills-registry.json and docs/CATALOG.md,
  is never served by the real am-skills-mcp server, and its example tool name
  (get_account_record) belongs only to the throwaway examples/mock-crm-mcp/ demo
  server, not any real CRM.
metadata:
  version: 1.0.0
  author: JJScar
  audience: technical
---

# Example: CRM Tool Lookup Convention (demo)

This file is a worked example for AM-019, not a real skill an agent should ever
load from the catalog — it's intentionally not in `skills/`. It exists so a future
skill author has a concrete template for the pattern described in
[`docs/crm-tool-calling-convention.md`](../../docs/crm-tool-calling-convention.md),
instead of just prose to interpret.

## What this demonstrates

An AM asks for account context on a named customer. Before asking the AM to recite
everything from memory, check whether a CRM/CS-platform MCP tool is currently
available and use it — then degrade gracefully if it isn't.

## Instructions

1. Note the account name the AM mentioned.
2. Look at your currently available tools for one that looks like an account or
   customer lookup — by name and description, not a hardcoded name. (In this demo,
   that tool is `get_account_record` from the throwaway `examples/mock-crm-mcp/`
   server; a real AM's tool will be named differently — e.g. something
   Salesforce-, HubSpot-, or Gainsight-specific.)
3. **If such a tool is available:** call it with the account name. Confirm what you
   found back to the AM rather than re-asking for the same information. If the tool
   returns "not found" or errors, say so plainly and ask the AM directly instead of
   guessing.
4. **If no such tool is available:** say so plainly, then ask the AM directly for
   the account context you need. Never fabricate plan tier, contract dates, usage
   trend, or ticket counts to fill a gap — an invented number presented as fact is
   worse than an honest "unknown."

## Worked example (using the mock-crm-mcp demo server)

- **AM says:** "What's the status on Acme Corp?"
- **Agent:** sees the `[DEMO/MOCK] Get Account Record` tool is available, calls
  `get_account_record({ account_name: "Acme Corp" })`, gets back a found record, and
  reports it: "Acme Corp is on the Enterprise plan (40 seats), renews 2027-01-15,
  usage is stable (~85% seat utilization), last contact was 2026-08-20, and there's
  1 open support ticket."
- **AM says:** "What's the status on Initech?" (not in the mock data)
- **Agent:** calls the tool, gets back `found: false`, and says: "I checked the CRM
  tool but don't see an account record for Initech — can you fill me in, or is that
  the right account name?"
- **AM says:** "What's the status on Acme Corp?" (no CRM tool configured this time)
- **Agent:** "I don't see a CRM/CS-platform tool configured right now, so I can't
  pull that automatically — what can you tell me about Acme Corp's plan, renewal
  date, and recent usage?"
