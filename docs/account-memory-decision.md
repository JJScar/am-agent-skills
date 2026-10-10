# Account memory decision

Resolved by DEC-5, DEC-6 and DEC-7 (see `docs/project-docs/Tickets.md`). Written up
here as a fixed reference so the account-memory tickets (AM-031 onward) don't need
to re-derive it. Supersedes the "technical AMs first" framing in
[`target-agent-decision.md`](target-agent-decision.md); that doc's MCP-first,
Claude-Desktop-primary reasoning still holds for the local server.

## The problem

Most account managers use AI by just chatting with it — and every chat starts from
zero. Claude doesn't know who the champion is, what was promised on last week's
call, or that the issue blocking the customer has been open for three weeks. The AM
re-pastes context every time, gets a generic answer, and gives up.

A catalog of skills alone doesn't fix that. A skill supplies the *method* (how to
prep a QBR); the AM already knows the method. What's missing is the *account
context* the method needs.

What already exists doesn't close the gap either:

- **Vendor MCP servers** (Vitally, Gainsight, Gong) only see their own tool's data.
- **Public `SKILL.md` files** are prompt templates you paste data into.
- **CRM servers** (Salesforce, HubSpot) are plain record CRUD with no
  account-management logic on top.

Nothing gives Claude a lasting memory of each account, and nothing covers the
technical-account-management side: open engineering issues per account and
commitments owed to the customer.

## Decision

The product is **account memory**: one persistent record per account that Claude
reads before answering and updates afterwards. Skills operate on that record
rather than asking the AM to paste data in.

Each record holds:

- **Stakeholders** — who's who, who the champion is, who has left.
- **Commitments** — what was promised, by whom, and when it's due.
- **Open issues** — technical issues and blockers per account.
- **Timeline** — dated interactions, newest first.
- **Source mapping** — the account's email domains, chat channels and issue-tracker
  project, so Claude can find new activity in the AM's own connected tools.

The exact format is defined in [`account-record-schema.md`](account-record-schema.md). A new
skill category, `account-memory`, holds the skills that work on records directly
(logging an interaction, weekly portfolio triage, refreshing an account).

**Primary audience: non-technical AMs** — people who chat with Claude and won't
edit a config file. The maintainer's own technical-account-management work is the
first real use case.

## How it's delivered

In stages, each one only built once the previous one has proven useful:

1. **Claude Project template (no code).** Copy the template, add account records,
   start chatting. Setup is a handful of steps with no terminal and no JSON.
2. **Research gate.** Two weeks of real use plus interviews with AMs. Nothing more
   is built until the design has been revised from what that shows.
3. **Local MCP server.** The existing `am-skills-mcp` server gains tools to read
   and write account records stored on the AM's own machine, outside this repo.
   Writes show a preview and only apply after the AM confirms, and every change is
   kept in a per-account change log.
4. **Self-hosted remote connector.** The same server, reachable as a claude.ai
   connector, so an AM's whole setup is pasting one URL. Hosted on the maintainer's
   own hardware using free tooling only. If a free remote setup turns out not to be
   feasible, the local server is the end state.

## Live data: connectors, not integrations

We don't build CRM integrations. Fresh activity comes from the connectors the AM
already has in claude.ai (Gmail, Calendar, Drive, Slack), matched to the right
account by the record's source mapping. Writes go only to the account store, never
to a CRM or any shared system. The same goes for call notes: notetakers such as Granola ship their own connectors,
so Claude can read today's call notes directly instead of the AM pasting them in.

Reading from any source is **opt-in and off by default**. The AM controls it at
two levels: whether the connector is connected at all (in claude.ai and the
vendor's own settings), and an access settings file of ours that turns each source
on or off, limits it to certain folders, and can exclude specific accounts. Nothing
read from a source is saved until the AM confirms it.

AMs who already have a CRM/CS-platform tool
configured can still use it via
[`crm-tool-calling-convention.md`](crm-tool-calling-convention.md) — it's an
optional extra, not a requirement.

## Data safety

Account records hold real customer information, so they never live in this repo.
They stay in the AM's own Claude Project or a data folder on their own machine.
Examples in the repo remain fully fabricated, as before.

## What this rules out

- Building or maintaining CRM connectors (Salesforce, HubSpot, Gainsight, …).
- Health scores and other numbers that CS platforms already compute.
- Teams, shared portfolios, sign-up and billing — the end state is a single-user
  connector.
- A CLI installer and a marketplace site.
