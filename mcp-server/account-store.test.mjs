// Account store tests (AM-039). Run with `npm test`.

import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, beforeEach, describe, test } from 'node:test'
import {
  AccountStore,
  RecordConflictError,
  RecordFormatError,
  RecordInvalidError,
  parseRecord,
  serializeRecord,
} from './account-store.mjs'

const EXAMPLES = fileURLToPath(new URL('../examples/account-records/', import.meta.url))
const EXAMPLE_SETTINGS = fileURLToPath(new URL('../examples/account-memory-settings.md', import.meta.url))
const ACME = readFileSync(join(EXAMPLES, 'acme-corp.md'), 'utf-8')

const dirs = []
function freshDataDir() {
  const dir = mkdtempSync(join(tmpdir(), 'am-skills-data-'))
  dirs.push(dir)
  cpSync(EXAMPLES, dir, { recursive: true })
  cpSync(EXAMPLE_SETTINGS, join(dir, 'account-memory-settings.md'))
  return dir
}
after(() => dirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })))

describe('round trip', () => {
  for (const file of readdirSync(EXAMPLES).filter((f) => f.endsWith('.md'))) {
    test(`${file} parses and serializes back byte for byte`, () => {
      const text = readFileSync(join(EXAMPLES, file), 'utf-8')
      const record = parseRecord(text, { file, slug: file.slice(0, -3) })
      assert.deepEqual(record.problems, [])
      assert.equal(serializeRecord(record), text)
    })
  }

  test('a hand-formatted table (odd spacing) is understood and normalised', () => {
    const messy = ACME.replace('| C-001 | Send the Q3 usage summary |', '|C-001|   Send the Q3 usage summary   |')
    const record = parseRecord(messy, { slug: 'acme-corp' })
    assert.equal(record.commitments[0].commitment, 'Send the Q3 usage summary')
    assert.equal(serializeRecord(record), ACME)
  })

  test('pipes inside a cell survive a round trip', () => {
    const record = parseRecord(ACME, { slug: 'acme-corp' })
    record.timeline[0].summary = 'Discussed plan A | plan B'
    const text = serializeRecord(record)
    assert.match(text, /plan A \\\| plan B/)
    assert.equal(parseRecord(text, { slug: 'acme-corp' }).timeline[0].summary, 'Discussed plan A | plan B')
  })

  test('unchanged frontmatter is written back exactly; changed frontmatter is re-dumped and reads back the same', () => {
    const record = parseRecord(ACME, { slug: 'acme-corp' })
    record.frontmatter.last_contact.call = '2026-10-08'
    const text = serializeRecord(record)
    const again = parseRecord(text, { slug: 'acme-corp' })
    assert.deepEqual(again.frontmatter, record.frontmatter)
    assert.equal(again.frontmatter.renewal_date, '2026-12-15') // still a string, not a Date
    assert.deepEqual(again.problems, [])
  })
})

describe('reading', () => {
  test('dates stay strings and the sections come back structured', () => {
    const record = parseRecord(ACME, { slug: 'acme-corp' })
    assert.equal(record.frontmatter.renewal_date, '2026-12-15')
    assert.equal(record.stakeholders.length, 4)
    assert.deepEqual(record.commitments[1], {
      id: 'C-002',
      commitment: 'Share the migration guide for the v4 API',
      owner: 'us',
      person: 'Account manager',
      due: '2026-10-03',
      status: 'open',
      source: 'call 2026-09-30',
    })
    assert.equal(record.issues[0].link, 'https://jira.example/browse/ACME-142')
    assert.match(record.notes, /^Acme is mid-way/)
  })

  test("a record's opt-out reads as the string off", () => {
    const record = parseRecord(readFileSync(join(EXAMPLES, 'umbrella-labs.md'), 'utf-8'), { slug: 'umbrella-labs' })
    assert.deepEqual(record.frontmatter.sources, { meeting_notes: 'off' })
  })
})

describe('structure errors name the file, section and line', () => {
  const cases = [
    ['no frontmatter', (t) => t.replace(/^---\n/, ''), /acme-corp\.md: must start with a --- frontmatter block/],
    ['bad YAML', (t) => t.replace('name: Acme Corp', 'name: [Acme'), /frontmatter is not valid YAML/],
    ['missing heading', (t) => t.replace('# Acme Corp\n', ''), /expected the "# <Account name>" heading/],
    ['missing section', (t) => t.replace(/## Timeline[\s\S]*?(?=## Notes)/, ''), /missing section "## Timeline"/],
    ['unknown section', (t) => t.replace('## Notes', '## Random thoughts'), /unknown section "## Random thoughts"/],
    ['sections out of order', (t) => t.replace('## Commitments', '## Issues'), /sections must be in this order/],
    ['wrong columns', (t) => t.replace('| ID | Commitment | Owner |', '| ID | Promise | Owner |'), /section "Commitments", line \d+: table columns must be exactly/],
    ['short row', (t) => t.replace('| C-001 | Send the Q3 usage summary | us |', '| C-001 | Send the Q3 usage summary |'), /section "Commitments", line \d+: row has 6 cells, expected 7/],
    ['prose inside a table section', (t) => t.replace('| C-005 |', 'some stray text\n| C-005 |'), /section "Commitments", line \d+: expected a table row/],
  ]
  for (const [name, mangle, message] of cases) {
    test(name, () => {
      assert.throws(() => parseRecord(mangle(ACME), { file: 'acme-corp.md', slug: 'acme-corp' }), (error) => {
        assert.ok(error instanceof RecordFormatError, error.message)
        assert.match(error.message, message)
        return true
      })
    })
  }

  test('the reported line number points at the bad row', () => {
    const bad = ACME.replace('| C-003 |', '| C-003 | extra |')
    try {
      parseRecord(bad, { file: 'acme-corp.md', slug: 'acme-corp' })
      assert.fail('should have thrown')
    } catch (error) {
      assert.equal(bad.split('\n')[error.line - 1].startsWith('| C-003 | extra |'), true)
    }
  })
})

describe('value problems are collected, not thrown', () => {
  test('bad dates, unknown values, two active champions and duplicate IDs', () => {
    const bad = ACME.replace('| C-002 | Share', '| C-001 | Share')
      .replace('2026-10-03 | open', '2026-02-30 | open')
      .replace('| Dana Whitfield | VP Engineering | no |', '| Dana Whitfield | VP Engineering | yes |')
      .replace('| ACME-142 | Webhook retries drop events under load | https://jira.example/browse/ACME-142 | 2026-09-02 | open |', '| ACME-142 | Webhook retries drop events under load | https://jira.example/browse/ACME-142 | 2026-09-02 | in progress |')
      .replace('renewal_date: 2026-12-15', 'renewal_date: next year')
    const { problems } = parseRecord(bad, { slug: 'acme-corp' })
    const text = problems.map((p) => `${p.where}: ${p.message}`).join('\n')
    assert.match(text, /due: must be a YYYY-MM-DD date or unknown/)
    assert.match(text, /status: must be open, blocked or resolved/)
    assert.match(text, /more than one active champion: Dana Whitfield, Priya Raman/)
    assert.match(text, /Commitments: duplicate ID C-001/)
    assert.match(text, /frontmatter.renewal_date: must be a YYYY-MM-DD date or null/)
  })
})

describe('AccountStore', () => {
  let dir
  let store
  beforeEach(() => {
    dir = freshDataDir()
    store = new AccountStore(dir)
  })

  test('lists accounts, skipping the settings file and anything that is not a record', () => {
    writeFileSync(join(dir, 'notes.txt'), 'not a record')
    writeFileSync(join(dir, '.hidden.md'), 'dotfile')
    assert.deepEqual(store.listSlugs(), ['acme-corp', 'initech', 'umbrella-labs', 'vandelay-industries'])
  })

  test('readAll reports a broken file instead of failing', () => {
    writeFileSync(join(dir, 'broken-co.md'), 'no frontmatter here')
    const { records, errors } = store.readAll()
    assert.equal(records.length, 4)
    assert.deepEqual(errors.map((e) => e.slug), ['broken-co'])
  })

  test('write → read keeps the change; files are owner-only', () => {
    const record = store.read('acme-corp')
    record.commitments[1].status = 'done'
    store.write(record)
    assert.equal(store.read('acme-corp').commitments[1].status, 'done')
    assert.equal(statSync(join(dir, 'acme-corp.md')).mode & 0o777, 0o600)
    assert.ok(!readdirSync(dir).some((f) => f.endsWith('.tmp')), 'no temp files left behind')
  })

  test('refuses to write a record with problems, leaving the file untouched', () => {
    const before = readFileSync(join(dir, 'acme-corp.md'), 'utf-8')
    const record = store.read('acme-corp')
    record.commitments[0].owner = 'someone'
    assert.throws(() => store.write(record), RecordInvalidError)
    assert.equal(readFileSync(join(dir, 'acme-corp.md'), 'utf-8'), before)
  })

  test('refuses to overwrite a file that changed on disk after it was read', () => {
    const record = store.read('acme-corp')
    const edited = store.read('acme-corp')
    edited.notes = 'Edited by hand in the meantime.'
    store.write(edited)
    record.commitments[1].status = 'done'
    assert.throws(() => store.write(record), RecordConflictError)
    assert.equal(store.read('acme-corp').notes, 'Edited by hand in the meantime.')
  })

  test('creates a new account, but never over an existing one', () => {
    const record = store.read('initech')
    record.slug = 'globex-inc'
    record.frontmatter = { ...record.frontmatter, name: 'Globex Inc' }
    record.title = 'Globex Inc'
    store.write(record, { expectNew: true })
    assert.equal(store.read('globex-inc').frontmatter.name, 'Globex Inc')
    assert.throws(() => store.write(store.read('initech'), { expectNew: true }), /already exists/)
  })

  test('rejects names that could escape the data folder or hit the settings file', () => {
    for (const slug of ['../etc/passwd', 'acme/../../x', 'Acme Corp', '', 'account-memory-settings']) {
      assert.throws(() => store.read(slug), /Invalid account name|settings file/, slug)
    }
  })

  test('a missing account is a clear error', () => {
    assert.throws(() => store.read('no-such-co'), /No account record "no-such-co"/)
  })
})
