# Target agent decision

Resolved by DEC-3 (see `docs/project-docs/Tickets.md`). Written up here as a fixed
reference so later tickets (AM-017, AM-018, AM-019) don't need to re-derive it.

## Decision

Distribution is **MCP-first**, not a bespoke CLI installer. The server ships as an
npm package with a `bin` entry (same shape as the reference repo's `packages/mcp`,
e.g. `agent-skills-mcp`) and runs locally via `npx`, over stdio transport, spawned
by the AM's own agent client.

## Why this means no infrastructure to run

- **No always-on server.** The AM's agent client (Claude Desktop, Claude Code,
  Cursor, or any other MCP-compatible client) spawns the process on demand — when
  the client starts or the tool is first called — and kills it when done.
- **No hosting cost.** It only runs on the AM's own machine, for their own use.
  There's nothing to keep "on" for other users, no server bill, no uptime to
  monitor.
- **A remote MCP (HTTP/SSE transport, always-on) is a possible future upgrade**
  for a zero-install experience, not a v1 requirement. Revisit only if local
  `npx` friction turns out to be a real adoption blocker.

## Primary vs. incidental target

**Primary v1 target: Claude Desktop.** That's the surface an actual technical AM
has open day-to-day — a normal chat window, with tool calls invisible to them. No
terminal, no editor, no setup step beyond configuring the server once in
`claude_desktop_config.json`.

**Claude Code and Cursor: incidental coverage, not the design target.** Both speak
MCP natively, so they get the same server for free with zero extra implementation
effort. But neither is where an AM lives — they're developer tools. Nothing in the
server's design (tool descriptions, error messages, setup instructions) should be
written with a developer audience in mind; write for the Claude Desktop chat
experience and let Code/Cursor ride along.

## What this rules out

- A bespoke CLI installer as a v1 requirement (downgraded to optional/deferred —
  AM-017 — only worth building if a specific target agent needs static files in a
  local skills folder and doesn't support MCP).
- Any always-on hosted infrastructure for v1.
- Designing the MCP server's UX around a terminal or IDE workflow.
