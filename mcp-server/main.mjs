#!/usr/bin/env node
// MCP server for the am-skills catalog. Distributed as an npm bin (`am-skills-mcp`).
//
// Two transports, one tool list (create-server.mjs):
// - stdio (default): spawned locally by the AM's own agent client — no always-on
//   server, no hosting cost. See docs/target-agent-decision.md (DEC-3), AM-018.
// - Streamable HTTP (`--http` or AM_SKILLS_TRANSPORT=http): an always-on remote
//   connector, e.g. on a laptop behind Tailscale Funnel. See http.mjs, AM-047,
//   and docs/self-hosting.md.

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './create-server.mjs'
import { startHttp } from './http.mjs'
import { buildIndexes, loadRegistry } from './registry.mjs'

function wantsHttp(argv = process.argv.slice(2), env = process.env) {
  return argv.includes('--http') || env.AM_SKILLS_TRANSPORT === 'http'
}

async function main() {
  process.stderr.write('[am-skills-mcp] starting\n')

  const indexes = buildIndexes(loadRegistry())
  const getIndexes = () => indexes

  if (wantsHttp()) {
    await startHttp(getIndexes)
  } else {
    await createServer(getIndexes).connect(new StdioServerTransport())
  }

  process.stderr.write('[am-skills-mcp] ready\n')
}

main().catch((error) => {
  process.stderr.write(`[am-skills-mcp] fatal: ${error instanceof Error ? error.stack : String(error)}\n`)
  process.exit(1)
})
