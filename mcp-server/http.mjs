// Streamable HTTP transport (AM-047), for running am-skills-mcp as a remote
// connector — e.g. on the founder's laptop behind Tailscale Funnel (DEC-6, DEC-11).
//
// Stateless: every MCP request gets a fresh McpServer + transport, so there's no
// session state to lose on restart and nothing shared between callers.
//
// Always binds to 127.0.0.1. The public HTTPS side is the tunnel's job (Funnel
// terminates TLS and forwards to localhost) — this process is never reachable
// directly from the network. Host-header validation stays on: only localhost and
// the hostnames in AM_SKILLS_PUBLIC_HOSTS are accepted, which blocks DNS-rebinding
// attacks from a browser on the same machine.
//
// Sign-in (AM-048): OAuth is ON by default. Assistants register themselves, the
// owner approves each one with a passphrase, and /mcp rejects any request without
// a valid access token. AM_SKILLS_AUTH=none turns it off — acceptable only while
// every tool serves public skill content; account-data tools refuse that mode.

import express from 'express'
import { metadataHandler } from '@modelcontextprotocol/sdk/server/auth/handlers/metadata.js'
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js'
import { getOAuthProtectedResourceMetadataUrl, mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { OwnerOAuthProvider } from './auth/provider.mjs'
import { AuthStore, defaultStateDir } from './auth/store.mjs'
import { createServer, SERVER_INFO } from './create-server.mjs'

const BIND_HOST = '127.0.0.1'
const DEFAULT_PORT = 8787
// MCP is served at both /mcp and the bare root: people pasting the connector URL
// into claude.ai or ChatGPT routinely leave off the /mcp, and the request then
// arrives as POST / (seen in the first real connection attempt).
const MCP_PATHS = ['/mcp', '/']
const AUTH_MODES = ['oauth', 'none']

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

  const auth = (env.AM_SKILLS_AUTH ?? 'oauth').trim().toLowerCase()
  if (!AUTH_MODES.includes(auth)) {
    throw new Error(`AM_SKILLS_AUTH must be "oauth" or "none", got "${env.AM_SKILLS_AUTH}"`)
  }

  // The address assistants use to reach us — the OAuth issuer and resource URLs are
  // built from it. Defaults to the first public (Funnel) host, else localhost for
  // local testing (the SDK only allows a non-HTTPS issuer on localhost).
  const publicUrl = new URL(env.AM_SKILLS_PUBLIC_URL ?? (publicHosts[0] ? `https://${publicHosts[0]}` : `http://localhost:${port}`))

  return { port, publicHosts, auth, publicUrl, stateDir: defaultStateDir(env) }
}

function jsonRpcError(res, status, message) {
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null })
}

// Installs the OAuth endpoints and returns the middleware that guards /mcp.
function installOAuth(app, { publicUrl, store }) {
  if (!store.passphrase) {
    throw new Error('Sign-in is on but no passphrase is set. Run "npm run auth:set-passphrase" first (or set AM_SKILLS_AUTH=none for a skills-only server).')
  }

  const issuerUrl = new URL('/', publicUrl)
  const resourceUrls = MCP_PATHS.map((path) => new URL(path, publicUrl))
  const provider = new OwnerOAuthProvider({ store, resourceUrls })

  // /.well-known/oauth-authorization-server, /.well-known/oauth-protected-resource/mcp,
  // /authorize, /token, /register, /revoke. Client secrets don't expire, so a connected
  // assistant isn't silently cut off after the SDK's default 30 days.
  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl,
      resourceServerUrl: resourceUrls[0],
      resourceName: 'Account Manager skills',
      clientRegistrationOptions: { clientSecretExpirySeconds: 0 },
    }),
  )
  // Protected-resource metadata for the bare-root URL too, for connectors added without /mcp.
  app.use(
    '/.well-known/oauth-protected-resource',
    metadataHandler({ resource: resourceUrls[1].href, authorization_servers: [issuerUrl.href], resource_name: 'Account Manager skills' }),
  )

  app.post('/consent', express.urlencoded({ extended: false, limit: '8kb' }), (req, res) => provider.handleConsent(req, res))

  // A 401 points the client at the metadata for the exact URL it called.
  const guards = Object.fromEntries(
    resourceUrls.map((url) => [
      url.pathname,
      requireBearerAuth({ verifier: provider, resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(url) }),
    ]),
  )
  return (req, res, next) => guards[req.path](req, res, next)
}

export function createHttpApp(getIndexes, { publicHosts = [], auth = 'none', publicUrl, store } = {}) {
  const app = createMcpExpressApp({
    host: BIND_HOST,
    allowedHosts: ['localhost', '127.0.0.1', '[::1]', ...publicHosts],
  })
  // Funnel proxies every request from localhost; trust its X-Forwarded-For so the SDK's
  // rate limits apply per real client instead of lumping everyone together.
  app.set('trust proxy', 'loopback')

  // Request log for the runbook's "is it working?" checks — method, path and
  // status only, never bodies, query strings or tokens.
  // originalUrl, not req.path: inside the SDK's mounted OAuth routers req.path is
  // relative ("/register" would log as "/"). The query string is dropped — it can
  // carry authorization codes and state.
  app.use((req, res, next) => {
    const path = req.originalUrl.split('?')[0]
    res.on('finish', () => log(`${req.method} ${path} → ${res.statusCode}`))
    next()
  })

  app.get('/health', (_req, res) => {
    res.json({ ok: true, server: SERVER_INFO.name, version: SERVER_INFO.version, auth })
  })

  const guard = auth === 'oauth' ? installOAuth(app, { publicUrl, store }) : (_req, _res, next) => next()

  app.post(MCP_PATHS, guard, async (req, res) => {
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
      log(`error handling POST ${req.path}: ${error instanceof Error ? error.message : String(error)}`)
      if (!res.headersSent) jsonRpcError(res, 500, 'Internal server error')
    }
  })

  // Stateless mode has no server-initiated stream and no sessions to delete.
  app.get(MCP_PATHS, (_req, res) => jsonRpcError(res, 405, 'Method not allowed'))
  app.delete(MCP_PATHS, (_req, res) => jsonRpcError(res, 405, 'Method not allowed'))

  return app
}

export function startHttp(getIndexes, config = readHttpConfig()) {
  const store = config.auth === 'oauth' ? new AuthStore(config.stateDir) : undefined
  const app = createHttpApp(getIndexes, { ...config, store })

  return new Promise((resolve, reject) => {
    const listener = app.listen(config.port, BIND_HOST, () => {
      const mode = config.auth === 'oauth' ? `sign-in on, as ${config.publicUrl.origin}` : 'no auth — skills-only'
      log(`listening on http://${BIND_HOST}:${config.port}/mcp (${mode})`)
      if (config.publicHosts.length) log(`accepting public host(s): ${config.publicHosts.join(', ')}`)
      resolve(listener)
    })
    listener.on('error', reject)
  })
}
