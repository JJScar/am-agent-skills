// Owner passphrase hashing for the sign-in page (AM-048). scrypt with a random salt,
// compared in constant time. Node's built-in crypto only — no new dependency.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export const MIN_PASSPHRASE_LENGTH = 12
const KEY_LENGTH = 64
const COST = 2 ** 15 // N; memory ≈ 128 * N * r bytes = 32 MiB with r = 8
const BLOCK_SIZE = 8
const PARALLELISM = 1
const MAX_MEM = 64 * 1024 * 1024

export function hashPassphrase(passphrase) {
  if (typeof passphrase !== 'string' || passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new Error(`Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters`)
  }
  const salt = randomBytes(16)
  const hash = scryptSync(passphrase, salt, KEY_LENGTH, { N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: MAX_MEM })
  return {
    algorithm: 'scrypt',
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELISM,
    salt: salt.toString('base64'),
    hash: hash.toString('base64'),
  }
}

export function verifyPassphrase(passphrase, record) {
  if (!record || record.algorithm !== 'scrypt' || typeof passphrase !== 'string') return false
  const expected = Buffer.from(record.hash, 'base64')
  const actual = scryptSync(passphrase, Buffer.from(record.salt, 'base64'), expected.length, {
    N: record.N,
    r: record.r,
    p: record.p,
    maxmem: MAX_MEM,
  })
  return timingSafeEqual(actual, expected)
}
