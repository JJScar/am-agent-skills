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
