// Streamable HTTP transport (AM-047), for running am-skills-mcp as a remote
// connector — e.g. on the founder's laptop behind Tailscale Funnel (DEC-6, DEC-11).
//
// Stateless: every POST /mcp gets a fresh McpServer + transport, so there's no
// session state to lose on restart and nothing shared between callers.
//
// Always binds to 127.0.0.1. The public HTTPS side is the tunnel's job (Funnel
// terminates TLS and forwards to localhost) — this process is never reachable
// directly from the network. Host-header validation stays on: only localhost and
// the hostnames in AM_SKILLS_PUBLIC_HOSTS are accepted, which blocks DNS-rebinding
// attacks from a browser on the same machine.
//
// No authentication yet. That's only acceptable because every tool here serves
// public skill content. Account-data tools must not be registered on this
// transport until OAuth (AM-048) is in place.

import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createServer, SERVER_INFO } from './create-server.mjs'

const BIND_HOST = '127.0.0.1'
const DEFAULT_PORT = 8787

function log(message) {
  process.stderr.write(`[am-skills-mcp] ${message}\n`)
}

export function readHttpConfig(env = process.env) {
  const port = Number(env.AM_SKILLS_PORT ?? DEFAULT_PORT)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`AM_SKILLS_PORT must be a port number, got "${env.AM_SKILLS_PORT}"`)
  }

  const publicHosts = (env.AM_SKILLS_PUBLIC_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)

  return { port, publicHosts }
}

function jsonRpcError(res, status, message) {
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null })
}

export function createHttpApp(getIndexes, { publicHosts = [] } = {}) {
  const app = createMcpExpressApp({
    host: BIND_HOST,
    allowedHosts: ['localhost', '127.0.0.1', '[::1]', ...publicHosts],
  })

  // Request log for the runbook's "is it working?" checks — method, path and
  // status only, never bodies (they'll carry account data once AM-040 lands).
  app.use((req, res, next) => {
    res.on('finish', () => log(`${req.method} ${req.path} → ${res.statusCode}`))
    next()
  })

  app.get('/health', (_req, res) => {
    res.json({ ok: true, server: SERVER_INFO.name, version: SERVER_INFO.version })
  })

  app.post('/mcp', async (req, res) => {
    const server = createServer(getIndexes)
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })

    res.on('close', () => {
      transport.close()
      server.close()
    })

    try {
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (error) {
      log(`error handling POST /mcp: ${error instanceof Error ? error.message : String(error)}`)
      if (!res.headersSent) jsonRpcError(res, 500, 'Internal server error')
    }
  })

  // Stateless mode has no server-initiated stream and no sessions to delete.
  app.get('/mcp', (_req, res) => jsonRpcError(res, 405, 'Method not allowed'))
  app.delete('/mcp', (_req, res) => jsonRpcError(res, 405, 'Method not allowed'))

  return app
}

export function startHttp(getIndexes, config = readHttpConfig()) {
  const app = createHttpApp(getIndexes, config)

  return new Promise((resolve, reject) => {
    const listener = app.listen(config.port, BIND_HOST, () => {
      log(`listening on http://${BIND_HOST}:${config.port}/mcp (no auth — skills-only)`)
      if (config.publicHosts.length) log(`accepting public host(s): ${config.publicHosts.join(', ')}`)
      resolve(listener)
    })
    listener.on('error', reject)
  })
}
