#!/usr/bin/env node
// Throwaway demo MCP server for AM-019 — NOT part of the real am-skills-mcp product
// (see mcp-server/). Stands in for "some AM's own, separately-configured
// CRM/CS-platform MCP tool" so docs/crm-tool-calling-convention.md's calling
// convention can be demonstrated and tested end-to-end instead of only described.
// A real CRM tool would have a vendor-specific name and live entirely outside this
// repo — this file exists only to make the convention testable.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const FAKE_ACCOUNTS = new Map([
  [
    'acme corp',
    {
      account_name: 'Acme Corp',
      plan_tier: 'Enterprise (40 seats)',
      contract_start: '2026-01-15',
      renewal_date: '2027-01-15',
      usage_trend: 'stable, ~85% seat utilization over the last 30 days',
      last_contact_date: '2026-08-20',
      open_support_tickets: 1,
    },
  ],
  [
    'globex inc',
    {
      account_name: 'Globex Inc',
      plan_tier: 'Growth (12 seats)',
      contract_start: '2026-05-01',
      renewal_date: '2027-05-01',
      usage_trend: 'declining, seat utilization down 20% over the last 30 days',
      last_contact_date: '2026-07-02',
      open_support_tickets: 3,
    },
  ],
])

const server = new McpServer({ name: 'mock-crm-mcp', version: '1.0.0' })

server.registerTool(
  'get_account_record',
  {
    title: '[DEMO/MOCK] Get Account Record',
    description:
      '[DEMO/MOCK — fabricated data, not a real CRM] Look up a customer account record ' +
      'by name. This is a throwaway example tool for testing the am-skills calling ' +
      'convention, not a real integration. A real AM\'s CRM tool will have a ' +
      'different, vendor-specific name.',
    inputSchema: z.object({ account_name: z.string().min(1) }),
  },
  async ({ account_name: accountName }) => {
    const record = FAKE_ACCOUNTS.get(accountName.trim().toLowerCase())

    const payload = record
      ? { found: true, ...record }
      : { found: false, message: `No account record found for '${accountName}' in this mock CRM.` }

    return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
process.stderr.write('[mock-crm-mcp] ready (demo/mock — not a real CRM)\n')
