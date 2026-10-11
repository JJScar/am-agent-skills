// Sign-in tests for AM-048: nothing reaches the MCP tools without a token, and the
// full OAuth flow an assistant like claude.ai runs (register → sign-in page →
// passphrase → code → token → refresh) works and fails safely. Run with `npm test`.

import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { createServer as createNetServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { hashPassphrase } from './auth/passphrase.mjs'
import { AuthStore } from './auth/store.mjs'
import { createHttpApp } from './http.mjs'
import { buildIndexes, loadRegistry } from './registry.mjs'

const PASSPHRASE = 'correct horse battery staple'
const REDIRECT_URI = 'https://claude.ai/api/mcp/auth_callback'

function freePort() {
  return new Promise((resolve) => {
    const srv = createNetServer().listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

function pkcePair() {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

const form = (fields) => new URLSearchParams(fields)

describe('OAuth sign-in', () => {
  const indexes = buildIndexes(loadRegistry())
  let stateDir
  let store
  let listener
  let base

  before(async () => {
    stateDir = mkdtempSync(join(tmpdir(), 'am-skills-auth-'))
    store = new AuthStore(stateDir)
    store.setPassphrase(hashPassphrase(PASSPHRASE))
    const port = await freePort()
    base = `http://localhost:${port}`
    const app = createHttpApp(() => indexes, { auth: 'oauth', publicUrl: new URL(base), store })
    listener = await new Promise((resolve) => {
      const l = app.listen(port, '127.0.0.1', () => resolve(l))
    })
  })

  after(async () => {
    await new Promise((resolve) => listener.close(resolve))
    rmSync(stateDir, { recursive: true, force: true })
  })

  async function register() {
    const res = await fetch(`${base}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: 'Claude', redirect_uris: [REDIRECT_URI], token_endpoint_auth_method: 'client_secret_post' }),
    })
    assert.equal(res.status, 201)
    return res.json()
  }

  // Runs GET /authorize and returns the sign-in page's request id.
  async function startAuthorization(client, { challenge, state = 'st-123', resource = `${base}/mcp` } = {}) {
    const url = new URL(`${base}/authorize`)
    url.search = form({
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: REDIRECT_URI,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
      resource,
    })
    const res = await fetch(url, { redirect: 'manual' })
    assert.equal(res.status, 200)
    const html = await res.text()
    assert.match(html, /Connect to your account memory\?/)
    assert.match(html, /<strong>Claude<\/strong>/)
    return html.match(/name="id" value="([^"]+)"/)[1]
  }

  function consent(id, fields) {
    return fetch(`${base}/consent`, { method: 'POST', body: form({ id, ...fields }), redirect: 'manual' })
  }

  function token(fields) {
    return fetch(`${base}/token`, { method: 'POST', body: form(fields) })
  }

  async function signIn(client) {
    const { verifier, challenge } = pkcePair()
    const id = await startAuthorization(client, { challenge })
    const approved = await consent(id, { passphrase: PASSPHRASE, action: 'approve' })
    assert.equal(approved.status, 302)
    const location = new URL(approved.headers.get('location'))
    const code = location.searchParams.get('code')
    const res = await token({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT_URI,
      client_id: client.client_id,
      client_secret: client.client_secret,
      resource: `${base}/mcp`,
    })
    assert.equal(res.status, 200)
    return { tokens: await res.json(), code, verifier, location }
  }

  test('MCP requests without a token are rejected, at /mcp and at /', async () => {
    for (const path of ['/mcp', '/']) {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      })
      assert.equal(res.status, 401, path)
      const expected = path === '/mcp' ? `${base}/.well-known/oauth-protected-resource/mcp` : `${base}/.well-known/oauth-protected-resource`
      assert.match(res.headers.get('www-authenticate'), new RegExp(`resource_metadata="${expected}"`))
    }
  })

  test('a made-up token is rejected', async () => {
    const transport = new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
      requestInit: { headers: { Authorization: 'Bearer not-a-real-token' } },
    })
    await assert.rejects(new Client({ name: 't', version: '0' }).connect(transport))
  })

  test('publishes the metadata claude.ai and ChatGPT look for', async () => {
    const prm = await (await fetch(`${base}/.well-known/oauth-protected-resource/mcp`)).json()
    assert.equal(prm.resource, `${base}/mcp`)
    assert.deepEqual(prm.authorization_servers, [`${base}/`])

    const rootPrm = await (await fetch(`${base}/.well-known/oauth-protected-resource`)).json()
    assert.equal(rootPrm.resource, `${base}/`)

    const as = await (await fetch(`${base}/.well-known/oauth-authorization-server`)).json()
    assert.equal(as.registration_endpoint, `${base}/register`)
    assert.deepEqual(as.code_challenge_methods_supported, ['S256'])
  })

  test('full flow: register, approve with passphrase, get a token, use the MCP tools', async () => {
    const client = await register()
    const { tokens, location } = await signIn(client)
    assert.equal(location.searchParams.get('state'), 'st-123')
    assert.ok(tokens.access_token && tokens.refresh_token)
    assert.equal(tokens.expires_in, 3600)

    const mcp = new Client({ name: 't', version: '0' })
    await mcp.connect(
      new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      }),
    )
    const { tools } = await mcp.listTools()
    assert.ok(tools.some((t) => t.name === 'search_skills'))
    await mcp.close()
  })

  test('an authorization code works once only', async () => {
    const client = await register()
    const { code, verifier } = await signIn(client)
    const replay = await token({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT_URI,
      client_id: client.client_id,
      client_secret: client.client_secret,
    })
    assert.equal(replay.status, 400)
    assert.equal((await replay.json()).error, 'invalid_grant')
  })

  test('a wrong PKCE verifier is rejected', async () => {
    const client = await register()
    const { challenge } = pkcePair()
    const id = await startAuthorization(client, { challenge })
    const approved = await consent(id, { passphrase: PASSPHRASE, action: 'approve' })
    const code = new URL(approved.headers.get('location')).searchParams.get('code')
    const res = await token({
      grant_type: 'authorization_code',
      code,
      code_verifier: pkcePair().verifier,
      redirect_uri: REDIRECT_URI,
      client_id: client.client_id,
      client_secret: client.client_secret,
    })
    assert.equal(res.status, 400)
  })

  test('refresh tokens rotate: the new one works, the old one is dead', async () => {
    const client = await register()
    const { tokens } = await signIn(client)
    const refresh = (refreshToken) =>
      token({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: client.client_id, client_secret: client.client_secret })

    const first = await refresh(tokens.refresh_token)
    assert.equal(first.status, 200)
    const rotated = await first.json()
    assert.notEqual(rotated.refresh_token, tokens.refresh_token)

    assert.equal((await refresh(tokens.refresh_token)).status, 400)
    assert.equal((await refresh(rotated.refresh_token)).status, 200)
  })

  test('a wrong passphrase shows the page again; five wrong attempts end the request', async () => {
    const client = await register()
    const id = await startAuthorization(client, { challenge: pkcePair().challenge })
    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await consent(id, { passphrase: 'wrong passphrase!!', action: 'approve' })
      assert.equal(res.status, 401)
      assert.match(await res.text(), /That passphrase is not right/)
    }
    assert.equal((await consent(id, { passphrase: 'wrong passphrase!!', action: 'approve' })).status, 403)
    // The request is gone, even with the right passphrase now.
    assert.equal((await consent(id, { passphrase: PASSPHRASE, action: 'approve' })).status, 400)
  })

  test('Deny sends the assistant an access_denied error', async () => {
    const client = await register()
    const id = await startAuthorization(client, { challenge: pkcePair().challenge, state: 'deny-state' })
    const res = await consent(id, { action: 'deny' })
    assert.equal(res.status, 302)
    const location = new URL(res.headers.get('location'))
    assert.equal(location.searchParams.get('error'), 'access_denied')
    assert.equal(location.searchParams.get('state'), 'deny-state')
    assert.equal(location.searchParams.get('code'), null)
  })

  test('an unregistered redirect URI is refused before any sign-in page', async () => {
    const client = await register()
    const url = new URL(`${base}/authorize`)
    url.search = form({
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: 'https://evil.example/callback',
      code_challenge: pkcePair().challenge,
      code_challenge_method: 'S256',
    })
    const res = await fetch(url, { redirect: 'manual' })
    assert.equal(res.status, 400)
  })

  test('tokens are stored hashed, in a file only the owner can read, and survive a restart', async () => {
    const client = await register()
    const { tokens } = await signIn(client)
    const file = join(stateDir, 'auth.json')
    const raw = readFileSync(file, 'utf-8')
    assert.ok(!raw.includes(tokens.access_token))
    assert.ok(!raw.includes(tokens.refresh_token))
    assert.ok(!raw.includes(PASSPHRASE))
    assert.equal(statSync(file).mode & 0o777, 0o600)

    const reloaded = new AuthStore(stateDir)
    assert.ok(reloaded.getToken('accessTokens', tokens.access_token))
  })

  // The SDK's own client-side OAuth is the same discovery logic real assistants run:
  // 401 → protected-resource metadata → authorization-server metadata → register →
  // authorize → token. If it gets in unaided (with a scripted "owner" typing the
  // passphrase), claude.ai and ChatGPT should too.
  for (const path of ['/mcp', '/']) {
    test(`the SDK's own OAuth client can sign in unaided (connector URL ${path})`, async () => {
      let saved = {}
      let pendingAuthUrl
      const authProvider = {
        get redirectUrl() {
          return REDIRECT_URI
        },
        get clientMetadata() {
          return { client_name: 'Claude', redirect_uris: [REDIRECT_URI], token_endpoint_auth_method: 'client_secret_post' }
        },
        clientInformation: () => saved.client,
        saveClientInformation: (info) => (saved.client = info),
        tokens: () => saved.tokens,
        saveTokens: (tokens) => (saved.tokens = tokens),
        saveCodeVerifier: (v) => (saved.verifier = v),
        codeVerifier: () => saved.verifier,
        redirectToAuthorization: (url) => (pendingAuthUrl = url),
      }
      const url = new URL(`${base}${path}`)

      // First attempt: no token, so the client discovers everything and asks for sign-in.
      await assert.rejects(new Client({ name: 't', version: '0' }).connect(new StreamableHTTPClientTransport(url, { authProvider })), /Unauthorized/)
      assert.ok(saved.client?.client_id, 'client registered itself')
      assert.equal(pendingAuthUrl.origin + pendingAuthUrl.pathname, `${base}/authorize`)

      // The owner opens the sign-in page and approves.
      const page = await (await fetch(pendingAuthUrl)).text()
      const id = page.match(/name="id" value="([^"]+)"/)[1]
      const approved = await consent(id, { passphrase: PASSPHRASE, action: 'approve' })
      const code = new URL(approved.headers.get('location')).searchParams.get('code')

      // The assistant finishes sign-in and connects for real.
      const transport = new StreamableHTTPClientTransport(url, { authProvider })
      await transport.finishAuth(code)
      const mcp = new Client({ name: 't', version: '0' })
      await mcp.connect(transport)
      assert.ok((await mcp.listTools()).tools.some((t) => t.name === 'read_skill'))
      await mcp.close()
    })
  }

  test('changing the passphrase while the server runs takes effect without a restart', async () => {
    const client = await register()
    const { tokens } = await signIn(client)

    const NEW = 'a different passphrase entirely'
    new AuthStore(stateDir).setPassphrase(hashPassphrase(NEW)) // as the CLI would, separately

    // Existing sign-ins are revoked…
    const old = new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
      requestInit: { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    })
    await assert.rejects(new Client({ name: 't', version: '0' }).connect(old))

    // …the old passphrase no longer approves, and the new one does.
    const id = await startAuthorization(client, { challenge: pkcePair().challenge })
    assert.equal((await consent(id, { passphrase: PASSPHRASE, action: 'approve' })).status, 401)
    assert.equal((await consent(id, { passphrase: NEW, action: 'approve' })).status, 302)

    // Put the suite's passphrase back for the tests that follow.
    new AuthStore(stateDir).setPassphrase(hashPassphrase(PASSPHRASE))
  })

  test('/health stays public and reports that sign-in is on', async () => {
    const body = await (await fetch(`${base}/health`)).json()
    assert.equal(body.auth, 'oauth')
  })
})

describe('OAuth configuration', () => {
  test('refuses to start with sign-in on but no passphrase set', () => {
    const dir = mkdtempSync(join(tmpdir(), 'am-skills-auth-empty-'))
    try {
      assert.throws(
        () => createHttpApp(() => ({}), { auth: 'oauth', publicUrl: new URL('http://localhost:1'), store: new AuthStore(dir) }),
        /auth:set-passphrase/,
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  // Regression: the server used to keep auth.json in memory from startup, so a
  // passphrase changed by `npm run auth:set-passphrase` (a separate process) was
  // silently written back to the old one on the server's next save.
  test('a passphrase changed by another process survives the running server saving', () => {
    const dir = mkdtempSync(join(tmpdir(), 'am-skills-auth-race-'))
    try {
      const server = new AuthStore(dir)
      server.setPassphrase(hashPassphrase(PASSPHRASE))
      server.putToken('accessTokens', 'old-token', { clientId: 'c', expiresAt: Date.now() / 1000 + 600 })

      const cli = new AuthStore(dir) // what set-passphrase.mjs does
      const newRecord = hashPassphrase('the brand new passphrase')
      cli.setPassphrase(newRecord)

      // The server sees the change straight away…
      assert.deepEqual(server.passphrase, newRecord)
      assert.equal(server.getToken('accessTokens', 'old-token'), undefined)

      // …and its next save keeps it rather than writing the old state back.
      server.putToken('accessTokens', 'new-token', { clientId: 'c', expiresAt: Date.now() / 1000 + 600 })
      const onDisk = new AuthStore(dir)
      assert.deepEqual(onDisk.passphrase, newRecord)
      assert.equal(onDisk.getToken('accessTokens', 'old-token'), undefined)
      assert.ok(onDisk.getToken('accessTokens', 'new-token'))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('a new passphrase signs every assistant out', () => {
    const dir = mkdtempSync(join(tmpdir(), 'am-skills-auth-reset-'))
    try {
      const s = new AuthStore(dir)
      s.setPassphrase(hashPassphrase(PASSPHRASE))
      s.putToken('accessTokens', 'tok', { clientId: 'c', expiresAt: Date.now() / 1000 + 60 })
      s.setPassphrase(hashPassphrase('another long passphrase'))
      assert.equal(s.getToken('accessTokens', 'tok'), undefined)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
