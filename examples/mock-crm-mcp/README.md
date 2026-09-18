# mock-crm-mcp (demo only)

**This is throwaway demo infrastructure for AM-019, not a real product.** It's a
stand-in for "some AM's own, separately-configured CRM/CS-platform MCP tool," built
only so [`docs/crm-tool-calling-convention.md`](../../docs/crm-tool-calling-convention.md)'s
calling convention could be tested end-to-end instead of just described. It is not
part of `am-skills-mcp` (see [`mcp-server/`](../../mcp-server/)), is never published,
and ships no real integration — every returned record is fabricated.

## What it exposes

One tool, `get_account_record({ account_name })`, returning a fabricated record for
two fixed fake companies ("Acme Corp", "Globex Inc") or a clean `found: false` for
anything else. Its MCP-visible description is prefixed `[DEMO/MOCK]` so it's never
mistaken for a real CRM tool if it's ever loaded in a real client.

## Running it standalone

```bash
node examples/mock-crm-mcp/main.mjs
```

Or, to poke at it interactively:

```bash
npm run mcp:inspect:crm-example
```

## Testing the calling convention end-to-end

To see [`example-crm-lookup-skill.md`](./example-crm-lookup-skill.md)'s convention
actually exercised by an agent, add both servers to an MCP client config alongside
each other:

```json
{
  "mcpServers": {
    "am-skills": {
      "command": "node",
      "args": ["/absolute/path/to/am-skills/mcp-server/main.mjs"]
    },
    "mock-crm-demo": {
      "command": "node",
      "args": ["/absolute/path/to/am-skills/examples/mock-crm-mcp/main.mjs"]
    }
  }
}
```

Then paste `example-crm-lookup-skill.md`'s contents into the agent's context (it's
intentionally not registered in the real catalog — see the doc above for why) and
ask it about "Acme Corp" or "Globex Inc" to see the lookup path, or an unlisted
company to see the graceful-fallback path.
