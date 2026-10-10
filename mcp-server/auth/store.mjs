// File-backed state for single-user OAuth (AM-048): the owner's passphrase hash,
// registered OAuth clients (claude.ai, ChatGPT, …), and issued tokens.
//
// Lives in AM_SKILLS_STATE_DIR (default ~/.am-skills), outside the repo, as
// auth.json with mode 0600. Tokens are stored only as SHA-256 hashes, so the file
// alone can't be replayed as a bearer token. Writes are atomic (temp file + rename)
// so a crash mid-write can't leave a half-written file.

import { createHash, randomBytes } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const STATE_VERSION = 1

export function defaultStateDir(env = process.env) {
  return env.AM_SKILLS_STATE_DIR || join(homedir(), '.am-skills')
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function newToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url')
}

function emptyState() {
  return { version: STATE_VERSION, passphrase: null, clients: {}, accessTokens: {}, refreshTokens: {} }
}

export class AuthStore {
  constructor(stateDir = defaultStateDir()) {
    this.stateDir = stateDir
    this.file = join(stateDir, 'auth.json')
    this.state = this.#load()
  }

  #load() {
    if (!existsSync(this.file)) return emptyState()
    const parsed = JSON.parse(readFileSync(this.file, 'utf-8'))
    if (parsed.version !== STATE_VERSION) {
      throw new Error(`${this.file}: unsupported version ${parsed.version} (expected ${STATE_VERSION})`)
    }
    return { ...emptyState(), ...parsed }
  }

  save() {
    this.#pruneExpired()
    mkdirSync(this.stateDir, { recursive: true, mode: 0o700 })
    const tmp = `${this.file}.${process.pid}.tmp`
    writeFileSync(tmp, `${JSON.stringify(this.state, null, 2)}\n`, { mode: 0o600 })
    renameSync(tmp, this.file)
    chmodSync(this.file, 0o600)
  }

  #pruneExpired() {
    const now = Date.now() / 1000
    for (const bucket of [this.state.accessTokens, this.state.refreshTokens]) {
      for (const [hash, record] of Object.entries(bucket)) {
        if (record.expiresAt < now) delete bucket[hash]
      }
    }
  }

  // --- passphrase ---
  get passphrase() {
    return this.state.passphrase
  }

  setPassphrase(record) {
    this.state.passphrase = record
    // A new passphrase signs every assistant out: they must approve again.
    this.state.accessTokens = {}
    this.state.refreshTokens = {}
    this.save()
  }

  // --- clients ---
  getClient(clientId) {
    return this.state.clients[clientId]
  }

  putClient(client) {
    this.state.clients[client.client_id] = client
    this.save()
  }

  // --- tokens (stored hashed) ---
  putToken(kind, token, record) {
    this.state[kind][hashToken(token)] = record
    this.save()
  }

  getToken(kind, token) {
    return this.state[kind][hashToken(token)]
  }

  deleteToken(kind, token) {
    const hash = hashToken(token)
    if (!(hash in this.state[kind])) return false
    delete this.state[kind][hash]
    this.save()
    return true
  }
}
