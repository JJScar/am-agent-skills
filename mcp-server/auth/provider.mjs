// Single-user OAuth authorization server for am-skills-mcp (AM-048).
//
// The laptop owner is the only user. When an assistant (claude.ai, ChatGPT, …) wants
// to connect, it registers itself automatically (POST /register, handled by the SDK),
// then sends the owner to GET /authorize. This provider answers with a sign-in page;
// the owner types their passphrase and approves, and the assistant gets a short-lived
// access token plus a rotating refresh token. Nothing reaches the MCP tools without one.
//
// The SDK's mcpAuthRouter does the protocol work (metadata, registration, PKCE
// checks, token endpoint); this file supplies the storage, the sign-in page and
// the token rules.

import { InvalidGrantError, InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js'
import { verifyPassphrase } from './passphrase.mjs'
import { newToken } from './store.mjs'

const ACCESS_TOKEN_TTL = 60 * 60 // 1 hour
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 // 30 days, rotated on every use
const CODE_TTL = 5 * 60
const PENDING_TTL = 10 * 60
const MAX_FAILURES_PER_REQUEST = 5
const MAX_FAILURES_PER_WINDOW = 10
const FAILURE_WINDOW = 15 * 60

const nowSeconds = () => Math.floor(Date.now() / 1000)

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function sameResource(a, b) {
  const strip = (u) => u.href.replace(/\/$/, '')
  return strip(a) === strip(b)
}

function redirectWith(redirectUri, params) {
  const url = new URL(redirectUri)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value)
  }
  return url.href
}

export class OwnerOAuthProvider {
  constructor({ store, resourceUrls }) {
    this.store = store
    this.resourceUrls = resourceUrls
    this.pending = new Map() // id -> { clientId, params, createdAt, failures }
    this.codes = new Map() // code -> { clientId, codeChallenge, redirectUri, resource, scopes, expiresAt }
    this.recentFailures = [] // timestamps, for the global lockout

    this.clientsStore = {
      getClient: (clientId) => this.store.getClient(clientId),
      registerClient: (client) => {
        this.store.putClient(client)
        return client
      },
    }
  }

  #resourceIsOurs(resource) {
    return !resource || this.resourceUrls.some((ours) => sameResource(ours, resource))
  }

  // --- authorization: show the sign-in page ---
  async authorize(client, params, res) {
    if (!this.#resourceIsOurs(params.resource)) {
      res.redirect(redirectWith(params.redirectUri, { error: 'invalid_target', error_description: 'Unknown resource', state: params.state }))
      return
    }
    this.#prune()
    const id = newToken(24)
    this.pending.set(id, { clientId: client.client_id, params, createdAt: nowSeconds(), failures: 0 })
    sendConsentPage(res, { id, client, redirectUri: params.redirectUri })
  }

  // --- POST /consent: the owner approved or denied ---
  handleConsent(req, res) {
    this.#prune()
    const { id, passphrase, action } = req.body ?? {}
    const request = typeof id === 'string' ? this.pending.get(id) : undefined
    if (!request) {
      sendMessagePage(res, 400, 'This sign-in request has expired', 'Go back to your assistant and connect again.')
      return
    }
    const client = this.store.getClient(request.clientId)
    const { params } = request

    if (action === 'deny') {
      this.pending.delete(id)
      res.redirect(redirectWith(params.redirectUri, { error: 'access_denied', state: params.state }))
      return
    }

    if (this.#lockedOut()) {
      sendMessagePage(res, 429, 'Too many wrong passphrases', 'Sign-in is paused for 15 minutes. Try again later.')
      return
    }

    if (!verifyPassphrase(passphrase, this.store.passphrase)) {
      this.recentFailures.push(nowSeconds())
      request.failures += 1
      if (request.failures >= MAX_FAILURES_PER_REQUEST) {
        this.pending.delete(id)
        sendMessagePage(res, 403, 'Too many wrong passphrases', 'Go back to your assistant and connect again.')
        return
      }
      sendConsentPage(res, { id, client, redirectUri: params.redirectUri, error: 'That passphrase is not right.' }, 401)
      return
    }

    this.pending.delete(id)
    const code = newToken()
    this.codes.set(code, {
      clientId: request.clientId,
      codeChallenge: params.codeChallenge,
      redirectUri: params.redirectUri,
      resource: params.resource?.href,
      scopes: params.scopes ?? [],
      expiresAt: nowSeconds() + CODE_TTL,
    })
    res.redirect(redirectWith(params.redirectUri, { code, state: params.state }))
  }

  #lockedOut() {
    const cutoff = nowSeconds() - FAILURE_WINDOW
    this.recentFailures = this.recentFailures.filter((t) => t > cutoff)
    return this.recentFailures.length >= MAX_FAILURES_PER_WINDOW
  }

  #prune() {
    const now = nowSeconds()
    for (const [id, p] of this.pending) if (p.createdAt + PENDING_TTL < now) this.pending.delete(id)
    for (const [code, c] of this.codes) if (c.expiresAt < now) this.codes.delete(code)
  }

  // --- token endpoint ---
  async challengeForAuthorizationCode(client, authorizationCode) {
    const record = this.codes.get(authorizationCode)
    if (!record || record.clientId !== client.client_id || record.expiresAt < nowSeconds()) {
      throw new InvalidGrantError('Invalid or expired authorization code')
    }
    return record.codeChallenge
  }

  async exchangeAuthorizationCode(client, authorizationCode, _codeVerifier, redirectUri, resource) {
    const record = this.codes.get(authorizationCode)
    this.codes.delete(authorizationCode) // single use, even on failure
    if (!record || record.clientId !== client.client_id || record.expiresAt < nowSeconds()) {
      throw new InvalidGrantError('Invalid or expired authorization code')
    }
    if (redirectUri !== undefined && redirectUri !== record.redirectUri) {
      throw new InvalidGrantError('redirect_uri does not match the authorization request')
    }
    if (resource && !this.#resourceIsOurs(resource)) {
      throw new InvalidGrantError('Unknown resource')
    }
    return this.#issueTokens(client.client_id, record.scopes, resource?.href ?? record.resource)
  }

  async exchangeRefreshToken(client, refreshToken, scopes, resource) {
    const record = this.store.getToken('refreshTokens', refreshToken)
    if (!record || record.clientId !== client.client_id || record.expiresAt < nowSeconds()) {
      throw new InvalidGrantError('Invalid or expired refresh token')
    }
    if (resource && !this.#resourceIsOurs(resource)) {
      throw new InvalidGrantError('Unknown resource')
    }
    this.store.deleteToken('refreshTokens', refreshToken) // rotate
    return this.#issueTokens(client.client_id, scopes?.length ? scopes : record.scopes, resource?.href ?? record.resource)
  }

  #issueTokens(clientId, scopes, resource) {
    const accessToken = newToken()
    const refreshToken = newToken()
    const now = nowSeconds()
    this.store.putToken('accessTokens', accessToken, { clientId, scopes, resource, expiresAt: now + ACCESS_TOKEN_TTL })
    this.store.putToken('refreshTokens', refreshToken, { clientId, scopes, resource, expiresAt: now + REFRESH_TOKEN_TTL })
    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: ACCESS_TOKEN_TTL,
      refresh_token: refreshToken,
      scope: scopes.length ? scopes.join(' ') : undefined,
    }
  }

  async verifyAccessToken(token) {
    const record = this.store.getToken('accessTokens', token)
    if (!record) throw new InvalidTokenError('Invalid or expired access token')
    return {
      token,
      clientId: record.clientId,
      scopes: record.scopes ?? [],
      expiresAt: record.expiresAt,
      resource: record.resource ? new URL(record.resource) : undefined,
    }
  }

  async revokeToken(client, { token }) {
    for (const kind of ['accessTokens', 'refreshTokens']) {
      const record = this.store.getToken(kind, token)
      if (record && record.clientId === client.client_id) this.store.deleteToken(kind, token)
    }
  }
}

// --- pages ---

function setPageHeaders(res, status) {
  res.status(status)
  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https:; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
  })
}

const PAGE_STYLE = `
  body { font: 16px/1.5 -apple-system, system-ui, sans-serif; background: #f6f6f4; color: #1d1d1b; margin: 0; }
  main { max-width: 420px; margin: 12vh auto; padding: 32px 28px; background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  h1 { font-size: 20px; margin: 0 0 12px; }
  p { margin: 0 0 16px; color: #4a4a46; }
  label { display: block; font-weight: 600; margin-bottom: 6px; }
  input[type=password] { width: 100%; box-sizing: border-box; padding: 10px 12px; font-size: 16px; border: 1px solid #c9c9c4; border-radius: 8px; }
  /* Approve comes first in the markup so pressing Enter approves; row-reverse puts it on the right. */
  .row { display: flex; flex-direction: row-reverse; gap: 12px; margin-top: 20px; }
  button { flex: 1; padding: 10px; font-size: 16px; border-radius: 8px; border: 1px solid #c9c9c4; background: #fff; cursor: pointer; }
  button[value=approve] { background: #1d1d1b; color: #fff; border-color: #1d1d1b; }
  .error { color: #b3261e; font-weight: 600; }
  .small { font-size: 13px; color: #6b6b66; }
  @media (prefers-color-scheme: dark) {
    body { background: #1b1b1a; color: #ededea; }
    main { background: #262624; box-shadow: none; }
    p { color: #c4c4bf; }
    input[type=password], button { background: #1b1b1a; color: #ededea; border-color: #4a4a46; }
    button[value=approve] { background: #ededea; color: #1b1b1a; }
    .small { color: #9a9a95; }
  }`

function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>${escapeHtml(title)}</title><style>${PAGE_STYLE}</style></head><body><main>${body}</main></body></html>`
}

function sendConsentPage(res, { id, client, redirectUri, error }, status = 200) {
  const clientName = client?.client_name || 'An assistant'
  const destination = (() => {
    try {
      return new URL(redirectUri).host
    } catch {
      return redirectUri
    }
  })()
  setPageHeaders(res, status)
  res.send(
    page(
      'Approve connection',
      `<h1>Connect to your account memory?</h1>
      <p><strong>${escapeHtml(clientName)}</strong> wants access to your Account Manager server. Approve only if you just asked it to connect.</p>
      ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
      <form method="post" action="/consent">
        <input type="hidden" name="id" value="${escapeHtml(id)}">
        <label for="passphrase">Your server passphrase</label>
        <input id="passphrase" name="passphrase" type="password" autocomplete="current-password" autofocus>
        <div class="row">
          <button type="submit" name="action" value="approve">Approve</button>
          <button type="submit" name="action" value="deny">Deny</button>
        </div>
      </form>
      <p class="small">After approving you'll be sent back to ${escapeHtml(destination)}.</p>`,
    ),
  )
}

function sendMessagePage(res, status, title, message) {
  setPageHeaders(res, status)
  res.send(page(title, `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>`))
}
