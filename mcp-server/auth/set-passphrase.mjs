#!/usr/bin/env node
// Sets the owner passphrase for the sign-in page (AM-048): `npm run auth:set-passphrase`.
// Prompts twice without echoing, stores only a scrypt hash in AM_SKILLS_STATE_DIR
// (default ~/.am-skills/auth.json), and signs every connected assistant out.

import { createInterface } from 'node:readline'
import { MIN_PASSPHRASE_LENGTH, hashPassphrase } from './passphrase.mjs'
import { AuthStore, defaultStateDir } from './store.mjs'

// One readline interface for every question: separate interfaces each grab the
// whole buffered stdin, so with piped input the second question never got an answer.
function createPrompter() {
  const tty = Boolean(process.stdin.isTTY)
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: tty })
  let muted = false
  if (tty) {
    const write = rl._writeToOutput.bind(rl)
    // While a hidden question is open, echo nothing: ask() prints the question itself.
    rl._writeToOutput = (text) => {
      if (!muted) write(text)
    }
  }
  const lines = rl[Symbol.asyncIterator]()

  return {
    async ask(question, { hidden = false } = {}) {
      muted = hidden
      process.stdout.write(question)
      const { value, done } = await lines.next()
      muted = false
      if (tty && hidden) process.stdout.write('\n')
      if (done) throw new Error('No input received. Nothing was changed.')
      return value
    },
    close: () => rl.close(),
  }
}

async function main() {
  const store = new AuthStore(defaultStateDir())
  console.log(`Setting the sign-in passphrase for am-skills-mcp (stored in ${store.file}).`)
  console.log(`Use at least ${MIN_PASSPHRASE_LENGTH} characters. A few random words works well.`)
  if (store.passphrase) console.log('This replaces the current passphrase and signs out every connected assistant.')

  const prompter = createPrompter()
  try {
    const first = await prompter.ask('New passphrase: ', { hidden: true })
    if (first.length < MIN_PASSPHRASE_LENGTH) {
      throw new Error(`Too short — use at least ${MIN_PASSPHRASE_LENGTH} characters. Nothing was changed.`)
    }
    const second = await prompter.ask('Type it again: ', { hidden: true })
    if (first !== second) {
      throw new Error("The two didn't match. Nothing was changed.")
    }
    store.setPassphrase(hashPassphrase(first))
  } finally {
    prompter.close()
  }
  console.log('Passphrase saved. Restart the server if it is running, then reconnect your assistants.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
