// File-backed state for single-user OAuth (AM-048): the owner's passphrase hash,
// registered OAuth clients (claude.ai, ChatGPT, …), and issued tokens.
//
// Lives in AM_SKILLS_STATE_DIR (default ~/.am-skills), outside the repo, as
// auth.json with mode 0600. Tokens are stored only as SHA-256 hashes, so the file
// alone can't be replayed as a bearer token. Writes are atomic (temp file + rename)
// so a crash mid-write can't leave a half-written file.
//
// The file is the source of truth, not this object's memory: `npm run
// auth:set-passphrase` runs as a separate process while the server is up. So every
// read first picks up any change on disk, and every write is read-fresh → change →
// save. An earlier version kept the startup copy in memory and its next save
// silently wrote the old passphrase back over a new one.

import { createHash, randomBytes } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
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
  #state
  #loadedVersion = null // identity of the file we last read or wrote

  constructor(stateDir = defaultStateDir()) {
    this.stateDir = stateDir
    this.file = join(stateDir, 'auth.json')
    this.#refresh()
  }

  // Every save renames a new file into place, so the inode changes on every write —
  // a reliable change marker even for two writes within the same millisecond.
  #fileVersion() {
    if (!existsSync(this.file)) return null
    const { ino, mtimeMs, size } = statSync(this.file)
    return `${ino}:${mtimeMs}:${size}`
  }

  #refresh() {
    const version = this.#fileVersion()
    if (this.#state && version === this.#loadedVersion) return
    if (version === null) {
      this.#state = emptyState()
    } else {
      const parsed = JSON.parse(readFileSync(this.file, 'utf-8'))
      if (parsed.version !== STATE_VERSION) {
        throw new Error(`${this.file}: unsupported version ${parsed.version} (expected ${STATE_VERSION})`)
      }
      this.#state = { ...emptyState(), ...parsed }
    }
    this.#loadedVersion = version
  }

  #mutate(change) {
    this.#refresh()
    const result = change(this.#state)
    this.#save()
    return result
  }

  #save() {
    this.#pruneExpired()
    mkdirSync(this.stateDir, { recursive: true, mode: 0o700 })
    const tmp = `${this.file}.${process.pid}.tmp`
    writeFileSync(tmp, `${JSON.stringify(this.#state, null, 2)}\n`, { mode: 0o600 })
    renameSync(tmp, this.file)
    chmodSync(this.file, 0o600)
    this.#loadedVersion = this.#fileVersion()
  }

  #pruneExpired() {
    const now = Date.now() / 1000
    for (const bucket of [this.#state.accessTokens, this.#state.refreshTokens]) {
      for (const [hash, record] of Object.entries(bucket)) {
        if (record.expiresAt < now) delete bucket[hash]
      }
    }
  }

  // --- passphrase ---
  get passphrase() {
    this.#refresh()
    return this.#state.passphrase
  }

  setPassphrase(record) {
    this.#mutate((state) => {
      state.passphrase = record
      // A new passphrase signs every assistant out: they must approve again.
      state.accessTokens = {}
      state.refreshTokens = {}
    })
  }

  // --- clients ---
  getClient(clientId) {
    this.#refresh()
    return this.#state.clients[clientId]
  }

  putClient(client) {
    this.#mutate((state) => {
      state.clients[client.client_id] = client
    })
  }

  // --- tokens (stored hashed) ---
  putToken(kind, token, record) {
    this.#mutate((state) => {
      state[kind][hashToken(token)] = record
    })
  }

  getToken(kind, token) {
    this.#refresh()
    return this.#state[kind][hashToken(token)]
  }

  deleteToken(kind, token) {
    const hash = hashToken(token)
    return this.#mutate((state) => {
      if (!(hash in state[kind])) return false
      delete state[kind][hash]
      return true
    })
  }
}
