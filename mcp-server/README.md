# am-skills-mcp

MCP server exposing the [am-skills](../README.md) catalog to any MCP-compatible AI
client. Instead of pasting a `SKILL.md` into your agent's custom instructions by
hand, the agent looks up and follows the right skill live, during the conversation.

**Primary target: Claude Desktop.** That's where a technical Account Manager
actually works day-to-day — a normal chat window, with tool calls invisible to them.
Claude Code and Cursor speak MCP too and work with zero extra setup, but they're
incidental coverage, not what this is designed around. See
[`docs/target-agent-decision.md`](../docs/target-agent-decision.md) for why.

No install, no always-on server, nothing to host: your agent client spawns the
process locally when it needs a skill, and kills it when done.

## Tools

| Tool | Input | Returns |
| :--- | :--- | :--- |
| `search_skills` | `query` — a short phrase describing what you need help with | Up to 5 matching skills, ranked, with a one-line usage hint |
| `read_skill` | `skill_name` — the exact name from `search_skills` | The skill's full instructions, plus the names of any bundled reference files |
| `fetch_skill_files` | `skill_name` + `file_paths` — exact paths from `read_skill`'s list | The text of those files |

The intended flow: `search_skills` → `read_skill` → follow the instructions →
`fetch_skill_files` only if the instructions say to read a specific bundled file.

## What this server doesn't do

It never looks up live account/CRM/CS-platform data itself — it only serves skill
*content*. A skill can instruct the agent to use the AM's own, separately-configured
CRM/CS-platform MCP tool if one is present (this server can't call another MCP
server even if it wanted to — only the client orchestrates across the tools in its
own list). See [`docs/crm-tool-calling-convention.md`](../docs/crm-tool-calling-convention.md)
for the calling convention, and `examples/mock-crm-mcp/` for a runnable worked
example.

## Quick start (Claude Desktop)

Add this to your `claude_desktop_config.json`, then restart Claude Desktop:

```json
{
  "mcpServers": {
    "am-skills": {
      "command": "npx",
      "args": ["-y", "am-skills-mcp"]
    }
  }
}
```

Any other MCP-compatible client (Claude Code, Cursor) uses the same block.

## Remote mode (claude.ai, ChatGPT)

The same server can run as an always-on remote connector over Streamable HTTP:

```bash
npm run start:http        # http://127.0.0.1:8787/mcp, plus /health
```

It only listens on `127.0.0.1`; a tunnel such as Tailscale Funnel provides the public
HTTPS address. Set `AM_SKILLS_PUBLIC_HOSTS` to that address's host name (comma-separated
for more than one) so its requests pass the Host-header check, and `AM_SKILLS_PORT` to
change the port. Both transports serve exactly the same tools (`create-server.mjs`).
Full Mac setup, including the background service and connecting claude.ai/ChatGPT:
[`docs/self-hosting.md`](../docs/self-hosting.md).

There's no sign-in yet, which is fine only because every tool serves public skill
content. Account-data tools won't be added to remote mode until OAuth exists.

## Local development

This package isn't published to npm yet. To point Claude Desktop (or the
[Inspector](https://github.com/modelcontextprotocol/inspector)) at your local
checkout instead, use `node` and an absolute path:

```json
{
  "mcpServers": {
    "am-skills": {
      "command": "node",
      "args": ["/absolute/path/to/am-skills/mcp-server/main.mjs"]
    }
  }
}
```

Or run `npx <path-to-this-repo>` from anywhere — `npx` on a local directory path
does a real package-scoped install (respecting `dependencies`/`files`), so it's a
faithful stand-in for the published `npx -y am-skills-mcp` flow.

To poke at the tools directly without a full agent client:

```bash
npm run mcp:inspect
```
