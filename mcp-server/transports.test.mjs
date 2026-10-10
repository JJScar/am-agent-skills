// Transport tests for AM-047: the HTTP transport must expose exactly the same tools as
// stdio, stay localhost-only, and reject unknown Host headers. Run with `npm test`.

import assert from 'node:assert/strict'
import { request } from 'node:http'
import { after, before, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { buildIndexes, loadRegistry } from './registry.mjs'
import { createHttpApp, readHttpConfig } from './http.mjs'

const MAIN = fileURLToPath(new URL('./main.mjs', import.meta.url))
const PUBLIC_HOST = 'test-laptop.example-tailnet.ts.net'

async function connect(transport) {
  const client = new Client({ name: 'transport-test', version: '0.0.0' })
  await client.connect(transport)
  return client
}

// fetch() silently drops a custom Host header (it's a forbidden header), so the
// Host-validation tests use node:http, which sends it as given — like a proxy would.
function getStatusWithHost(url, host) {
  return new Promise((resolve, reject) => {
    const req = request(url, { headers: { Host: host } }, (res) => {
      res.resume()
      resolve(res.statusCode)
    })
    req.on('error', reject)
    req.end()
  })
}

function textOf(result) {
  return result.content.map((part) => part.text).join('\n')
}

describe('Streamable HTTP transport', () => {
  let listener
  let baseUrl
  let httpClient
  let stdioClient

  before(async () => {
    const indexes = buildIndexes(loadRegistry())
    const app = createHttpApp(() => indexes, { publicHosts: [PUBLIC_HOST] })
    listener = await new Promise((resolve) => {
      const l = app.listen(0, '127.0.0.1', () => resolve(l))
    })
    baseUrl = `http://127.0.0.1:${listener.address().port}`

    httpClient = await connect(new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`)))
    stdioClient = await connect(new StdioClientTransport({ command: process.execPath, args: [MAIN], stderr: 'ignore' }))
  })

  after(async () => {
    await httpClient?.close()
    await stdioClient?.close()
    await new Promise((resolve) => listener.close(resolve))
  })

  test('exposes the same tools, with the same schemas, as stdio', async () => {
    const [overHttp, overStdio] = await Promise.all([httpClient.listTools(), stdioClient.listTools()])
    assert.deepEqual(overHttp.tools, overStdio.tools)
    assert.deepEqual(
      overHttp.tools.map((t) => t.name).sort(),
      ['fetch_skill_files', 'read_skill', 'search_skills'],
    )
  })

  test('search_skills works over HTTP', async () => {
    const result = await httpClient.callTool({
      name: 'search_skills',
      arguments: { query: 'which accounts need me this week' },
    })
    assert.ok(!result.isError)
    assert.match(textOf(result), /portfolio-triage/)
  })

  test('an unknown skill is a clean tool error, not a crash', async () => {
    const result = await httpClient.callTool({ name: 'read_skill', arguments: { skill_name: 'no-such-skill' } })
    assert.equal(result.isError, true)
    // The server keeps answering afterwards.
    assert.ok((await httpClient.listTools()).tools.length > 0)
  })

  test('also serves MCP at the bare root, for a connector URL pasted without /mcp', async () => {
    const rootClient = await connect(new StreamableHTTPClientTransport(new URL(`${baseUrl}/`)))
    try {
      const { tools } = await rootClient.listTools()
      assert.ok(tools.some((t) => t.name === 'search_skills'))
    } finally {
      await rootClient.close()
    }
  })

  test('health endpoint answers', async () => {
    const res = await fetch(`${baseUrl}/health`)
    assert.equal(res.status, 200)
    assert.equal((await res.json()).ok, true)
  })

  test('rejects a Host header that is not localhost or a configured public host', async () => {
    assert.equal(await getStatusWithHost(`${baseUrl}/health`, 'evil.example.com'), 403)
  })

  test('accepts the configured public host (what Tailscale Funnel forwards)', async () => {
    assert.equal(await getStatusWithHost(`${baseUrl}/health`, PUBLIC_HOST), 200)
  })

  test('GET is not allowed in stateless mode, at /mcp or /', async () => {
    assert.equal((await fetch(`${baseUrl}/mcp`)).status, 405)
    assert.equal((await fetch(`${baseUrl}/`)).status, 405)
  })
})

describe('readHttpConfig', () => {
  test('defaults: port 8787, no public hosts, sign-in on, localhost URL', () => {
    const config = readHttpConfig({ AM_SKILLS_STATE_DIR: '/tmp/x' })
    assert.equal(config.port, 8787)
    assert.deepEqual(config.publicHosts, [])
    assert.equal(config.auth, 'oauth')
    assert.equal(config.publicUrl.href, 'http://localhost:8787/')
    assert.equal(config.stateDir, '/tmp/x')
  })

  test('parses a comma-separated, case-insensitive host list and derives the public URL from it', () => {
    const config = readHttpConfig({ AM_SKILLS_PORT: '9000', AM_SKILLS_PUBLIC_HOSTS: ' A.ts.net, b.ts.net ,' })
    assert.equal(config.port, 9000)
    assert.deepEqual(config.publicHosts, ['a.ts.net', 'b.ts.net'])
    assert.equal(config.publicUrl.href, 'https://a.ts.net/')
  })

  test('AM_SKILLS_AUTH=none turns sign-in off; anything else is rejected', () => {
    assert.equal(readHttpConfig({ AM_SKILLS_AUTH: 'none' }).auth, 'none')
    assert.throws(() => readHttpConfig({ AM_SKILLS_AUTH: 'maybe' }), /AM_SKILLS_AUTH/)
  })

  test('rejects a bad port', () => {
    assert.throws(() => readHttpConfig({ AM_SKILLS_PORT: 'eighty' }), /AM_SKILLS_PORT/)
  })
})
