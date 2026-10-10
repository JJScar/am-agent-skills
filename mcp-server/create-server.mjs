// Builds one McpServer with every tool registered. Shared by both transports
// (stdio in main.mjs, Streamable HTTP in http.mjs) so the two can never expose
// different tool lists — AM-047's acceptance criterion.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerFetchSkillFilesTool } from './tools/fetch-skill-files.mjs'
import { registerReadSkillTool } from './tools/read-skill.mjs'
import { registerSearchSkillsTool } from './tools/search-skills.mjs'

export const SERVER_INFO = { name: 'am-skills-mcp', version: '1.1.0' }

export function createServer(getIndexes) {
  const server = new McpServer(SERVER_INFO)

  registerSearchSkillsTool(server, getIndexes)
  registerReadSkillTool(server, getIndexes)
  registerFetchSkillFilesTool(server, getIndexes)

  return server
}
