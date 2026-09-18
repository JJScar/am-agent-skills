#!/usr/bin/env node
// MCP server for the am-skills catalog. Distributed as an npm bin (`am-skills-mcp`),
// spawned locally by the AM's own agent client over stdio — no always-on server, no
// hosting cost. See docs/target-agent-decision.md (DEC-3) and
// docs/project-docs/Tickets.md (AM-018).

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { buildIndexes, loadRegistry } from './registry.mjs'
import { registerFetchSkillFilesTool } from './tools/fetch-skill-files.mjs'
import { registerReadSkillTool } from './tools/read-skill.mjs'
import { registerSearchSkillsTool } from './tools/search-skills.mjs'

async function main() {
  process.stderr.write('[am-skills-mcp] starting\n')

  const indexes = buildIndexes(loadRegistry())
  const getIndexes = () => indexes

  const server = new McpServer({ name: 'am-skills-mcp', version: '1.0.0' })

  registerSearchSkillsTool(server, getIndexes)
  registerReadSkillTool(server, getIndexes)
  registerFetchSkillFilesTool(server, getIndexes)

  const transport = new StdioServerTransport()
  await server.connect(transport)

  process.stderr.write('[am-skills-mcp] ready\n')
}

main().catch((error) => {
  process.stderr.write(`[am-skills-mcp] fatal: ${error instanceof Error ? error.stack : String(error)}\n`)
  process.exit(1)
})
