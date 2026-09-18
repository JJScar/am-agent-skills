# CRM/CS-platform tool calling convention

Resolved by AM-019, per DEC-4 and §4/§7 of `docs/project-docs/ARCHITECTURE.md`. This
is the one canonical convention every skill should follow when it wants live,
AM-specific read-only data (a CRM record, a CS-platform health score, a billing
lookup) — not just CRM specifically, and not something each skill should re-derive
on its own.

## The rule

**We never build or host a connector.** A skill can *instruct* an agent to use the
AM's own, separately-configured MCP tool (Salesforce, HubSpot, Gainsight, a billing
system, whatever the AM actually has) if one is present — it must never assume a
specific account, hardcode an endpoint, or ship a credential.

This isn't only a policy choice — it isn't technically implementable any other way.
MCP servers cannot discover or call each other; only the client/agent orchestrates
across the multiple servers in its own tool list. `am-skills-mcp` (see
`mcp-server/`) has no mechanism to reach into some other, separately-configured CRM
server even if we wanted to. The convention below is necessarily something a skill's
*instructions* tell the agent to do, interpreted at chat time — not server-side code.

## Detection convention

MCP has no standard "give me the CRM tool" capability-discovery mechanism, and real
CRM/CS-platform tools have vendor-specific names we can't enumerate in advance. So a
skill's instructions should tell the agent to:

1. Look at its currently available tools for one that looks like an account/
   customer/CRM lookup, health-score query, or similar, by its name and description
   — never a hardcoded tool name.
2. If one is found, use it — that's a live data source instead of the AM reciting
   everything from memory.
3. If none is found, or the tool errors or returns nothing, say so plainly rather
   than silently failing or guessing.

## Degradation convention

This is the canonical version of the fallback wording already used (independently,
slightly differently worded each time) across the shipped technical skills. New
skills should use this wording directly rather than reinventing it:

> If a CRM/CS-platform tool is configured, use it to pull the relevant data instead
> of asking the AM to recite it — confirm what you found rather than re-asking. If
> no such tool is configured, or the lookup fails, say so plainly and ask the AM
> directly. Never fabricate the missing data to fill a gap — an invented number
> presented as fact is worse than an honest "unknown."

## Worked example

Written prose is easy to nod along to and hard to verify. `examples/mock-crm-mcp/`
is a small, real, runnable MCP server (fabricated data only, never a real
integration) standing in for "some AM's own CRM tool," paired with
[`examples/mock-crm-mcp/example-crm-lookup-skill.md`](../examples/mock-crm-mcp/example-crm-lookup-skill.md),
a full worked skill file demonstrating this exact convention end-to-end — including
both the successful-lookup and tool-absent paths. See
[`examples/mock-crm-mcp/README.md`](../examples/mock-crm-mcp/README.md) for how to
run it.

That example skill is deliberately **not** a real catalog entry (not in `skills/`,
not in `skills-registry.json`, not in `docs/CATALOG.md`, never served by the real
`am-skills-mcp`). Its example tool name (`get_account_record`) belongs only to the
throwaway demo server — registering it for real would mean the real, shipped
`read_skill` handing an actual AM a skill that names a specific fake tool, which is
the exact anti-pattern this whole convention exists to prevent.

## Already-shipped skills following this convention

`kickoff-prep`, `churn-signal-triage`, `qbr-prep`, and `renewal-prep` each already
have a "Using a CRM/CS-platform tool" section following this pattern in spirit
(written before this doc existed, hence the independent wording) — each now points
back here as the canonical reference.
