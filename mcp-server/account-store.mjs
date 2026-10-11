// Account store (AM-039): reads, parses, validates and writes account records — the
// markdown files defined in docs/account-record-schema.md — from a data folder on
// the server's machine.
//
// The data folder is AM_SKILLS_DATA_DIR (default ~/am-skills-data), always outside
// the repo, so real customer data can never be committed. Files are written
// atomically with mode 0600 inside a 0700 folder.
//
// Two kinds of problems, handled differently:
// - Structure errors (bad YAML, a missing or unknown section, wrong table columns,
//   a malformed row) throw RecordFormatError naming the file, section and line —
//   the record can't be understood at all.
// - Value problems (a malformed date, an unknown status, two active champions, a
//   duplicate ID) are collected in `record.problems`, so one typo doesn't hide a whole
//   account from triage. Writing refuses any record that has problems.
//
// Round-trip: parse → serialize reproduces a canonically formatted file byte for
// byte. Frontmatter that wasn't changed is written back exactly as it was read.

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import yaml from 'js-yaml'

export const SETTINGS_FILE = 'account-memory-settings.md'
const SCHEMA_VERSION = 1
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const SOURCES = ['meeting_notes', 'email', 'calendar', 'chat', 'drive']
const FRONTMATTER_KEYS = [
  'schema_version',
  'name',
  'domains',
  'channels',
  'issue_tracker',
  'renewal_date',
  'last_contact',
  'last_refreshed',
  'sources',
]

// Section → columns (exact header text, in order) → record keys.
export const SECTIONS = {
  Stakeholders: {
    key: 'stakeholders',
    columns: [
      ['Name', 'name'],
      ['Role', 'role'],
      ['Champion', 'champion'],
      ['Status', 'status'],
      ['Last seen', 'lastSeen'],
      ['Notes', 'notes'],
    ],
  },
  Commitments: {
    key: 'commitments',
    columns: [
      ['ID', 'id'],
      ['Commitment', 'commitment'],
      ['Owner', 'owner'],
      ['Person', 'person'],
      ['Due', 'due'],
      ['Status', 'status'],
      ['Source', 'source'],
    ],
  },
  Issues: {
    key: 'issues',
    columns: [
      ['ID', 'id'],
      ['Issue', 'issue'],
      ['Link', 'link'],
      ['Opened', 'opened'],
      ['Status', 'status'],
    ],
  },
  Timeline: {
    key: 'timeline',
    columns: [
      ['Date', 'date'],
      ['Type', 'type'],
      ['Summary', 'summary'],
    ],
  },
}
const SECTION_ORDER = Object.keys(SECTIONS)

const RAW_FRONTMATTER = Symbol('rawFrontmatter')
const FILE_VERSION = Symbol('fileVersion')

export class RecordFormatError extends Error {
  constructor(file, message, { section, line } = {}) {
    const where = [file, section && `section "${section}"`, line && `line ${line}`].filter(Boolean).join(', ')
    super(`${where}: ${message}`)
    this.name = 'RecordFormatError'
    this.file = file
    this.section = section
    this.line = line
  }
}

export class RecordConflictError extends Error {
  constructor(slug) {
    super(`${slug}.md changed on disk since it was read — read it again and reapply the change`)
    this.name = 'RecordConflictError'
  }
}

export class RecordInvalidError extends Error {
  constructor(slug, problems) {
    super(`${slug}.md not saved — ${problems.length} problem(s): ${problems.map((p) => `${p.where}: ${p.message}`).join('; ')}`)
    this.name = 'RecordInvalidError'
    this.problems = problems
  }
}

export function defaultDataDir(env = process.env) {
  return env.AM_SKILLS_DATA_DIR || join(homedir(), 'am-skills-data')
}

export function assertSlug(slug) {
  if (typeof slug !== 'string' || !SLUG.test(slug)) {
    throw new Error(`Invalid account name "${slug}": use the record's file name without .md, e.g. "acme-corp"`)
  }
  if (`${slug}.md` === SETTINGS_FILE) {
    throw new Error(`"${slug}" is the settings file, not an account`)
  }
}

// --- tables ---

function splitRow(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|') || trimmed.length < 2) return null
  const inner = trimmed.slice(1, -1)
  const cells = []
  let current = ''
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === '\\' && inner[i + 1] === '|') {
      current += '|'
      i++
    } else if (inner[i] === '|') {
      cells.push(current.trim())
      current = ''
    } else {
      current += inner[i]
    }
  }
  cells.push(current.trim())
  return cells
}

function renderRow(cells) {
  return `|${cells.map((cell) => (cell === '' ? ' ' : ` ${String(cell).replaceAll('|', '\\|')} `)).join('|')}|`
}

function parseTable(file, sectionName, lines) {
  const spec = SECTIONS[sectionName]
  const expected = spec.columns.map(([header]) => header)
  const content = lines.filter(({ text }) => text.trim() !== '')
  if (content.length < 2) {
    throw new RecordFormatError(file, 'expected a table with a header row and a --- separator row', {
      section: sectionName,
      line: content[0]?.number,
    })
  }

  const [header, separator, ...rows] = content
  const headerCells = splitRow(header.text)
  if (!headerCells || headerCells.join('|') !== expected.join('|')) {
    throw new RecordFormatError(file, `table columns must be exactly: ${expected.join(' | ')}`, {
      section: sectionName,
      line: header.number,
    })
  }
  const separatorCells = splitRow(separator.text)
  if (!separatorCells || separatorCells.length !== expected.length || !separatorCells.every((c) => /^:?-{3,}:?$/.test(c))) {
    throw new RecordFormatError(file, 'the second table row must be the | --- | separator', {
      section: sectionName,
      line: separator.number,
    })
  }

  return rows.map(({ text, number }) => {
    const cells = splitRow(text)
    if (!cells) {
      throw new RecordFormatError(file, 'expected a table row starting and ending with |', { section: sectionName, line: number })
    }
    if (cells.length !== expected.length) {
      throw new RecordFormatError(file, `row has ${cells.length} cells, expected ${expected.length}`, {
        section: sectionName,
        line: number,
      })
    }
    return Object.fromEntries(spec.columns.map(([, key], i) => [key, cells[i]]))
  })
}

function renderTable(sectionName, rows) {
  const spec = SECTIONS[sectionName]
  return [
    renderRow(spec.columns.map(([header]) => header)),
    renderRow(spec.columns.map(() => '---')),
    ...rows.map((row) => renderRow(spec.columns.map(([, key]) => row[key] ?? ''))),
  ].join('\n')
}

// --- parse / serialize ---

export function parseRecord(text, { file = '<record>', slug } = {}) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new RecordFormatError(file, 'must start with a --- frontmatter block')
  const [, frontmatterText, body] = match
  const bodyStartLine = frontmatterText.split('\n').length + 3

  let frontmatter
  try {
    // JSON_SCHEMA keeps 2026-12-15 as a string (the default schema would make it a Date).
    frontmatter = yaml.load(frontmatterText, { schema: yaml.JSON_SCHEMA })
  } catch (error) {
    throw new RecordFormatError(file, `frontmatter is not valid YAML: ${error.message}`)
  }
  if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    throw new RecordFormatError(file, 'frontmatter must be a set of key: value fields')
  }

  const lines = body.split('\n').map((text, i) => ({ text, number: bodyStartLine + i }))
  let index = 0
  const skipBlank = () => {
    while (index < lines.length && lines[index].text.trim() === '') index++
  }

  skipBlank()
  const heading = lines[index]?.text.match(/^# (.+)$/)
  if (!heading) throw new RecordFormatError(file, 'expected the "# <Account name>" heading after the frontmatter', { line: lines[index]?.number })
  const title = heading[1].trim()
  index++

  const sections = {}
  let notes = null
  let expectedIndex = 0
  while (true) {
    skipBlank()
    if (index >= lines.length) break
    const sectionMatch = lines[index].text.match(/^## (.+)$/)
    if (!sectionMatch) {
      throw new RecordFormatError(file, 'expected a "## <Section>" heading', { line: lines[index].number })
    }
    const name = sectionMatch[1].trim()
    const headingLine = lines[index].number
    index++

    if (name === 'Notes') {
      if (expectedIndex < SECTION_ORDER.length) {
        throw new RecordFormatError(file, `missing section "## ${SECTION_ORDER[expectedIndex]}" (it must come before "## Notes")`, { line: headingLine })
      }
      notes = lines
        .slice(index)
        .map((l) => l.text)
        .join('\n')
        .replace(/^\n+/, '')
        .replace(/\n+$/, '')
      index = lines.length
      break
    }
    if (!(name in SECTIONS)) {
      throw new RecordFormatError(file, `unknown section "## ${name}" (allowed: ${[...SECTION_ORDER, 'Notes'].join(', ')})`, { line: headingLine })
    }
    if (name !== SECTION_ORDER[expectedIndex]) {
      throw new RecordFormatError(file, `sections must be in this order: ${SECTION_ORDER.join(', ')}; expected "## ${SECTION_ORDER[expectedIndex]}"`, {
        line: headingLine,
      })
    }

    const tableLines = []
    while (index < lines.length && !/^##? /.test(lines[index].text)) tableLines.push(lines[index++])
    sections[name] = parseTable(file, name, tableLines)
    expectedIndex++
  }
  if (expectedIndex < SECTION_ORDER.length) {
    throw new RecordFormatError(file, `missing section "## ${SECTION_ORDER[expectedIndex]}"`)
  }

  const record = {
    slug,
    frontmatter,
    title,
    ...Object.fromEntries(SECTION_ORDER.map((name) => [SECTIONS[name].key, sections[name]])),
    notes,
  }
  Object.defineProperty(record, RAW_FRONTMATTER, {
    value: { text: frontmatterText, json: JSON.stringify(frontmatter) },
    enumerable: false,
  })
  record.problems = validateRecord(record)
  return record
}

function dumpFrontmatter(frontmatter) {
  const ordered = {}
  for (const key of FRONTMATTER_KEYS) if (key in frontmatter) ordered[key] = frontmatter[key]
  for (const key of Object.keys(frontmatter)) if (!(key in ordered)) ordered[key] = frontmatter[key]
  return yaml.dump(ordered, { schema: yaml.JSON_SCHEMA, lineWidth: -1, noRefs: true, flowLevel: -1 }).trimEnd()
}

export function serializeRecord(record) {
  const raw = record[RAW_FRONTMATTER]
  const frontmatterText = raw && raw.json === JSON.stringify(record.frontmatter) ? raw.text : dumpFrontmatter(record.frontmatter)
  const parts = [`---\n${frontmatterText}\n---`, `# ${record.frontmatter.name ?? record.title}`]
  for (const name of SECTION_ORDER) {
    parts.push(`## ${name}`, renderTable(name, record[SECTIONS[name].key] ?? []))
  }
  if (record.notes !== null && record.notes !== undefined && record.notes !== '') {
    parts.push('## Notes', record.notes)
  }
  return `${parts.join('\n\n')}\n`
}

// --- validation (value problems, not structure) ---

function isRealDate(value) {
  if (!DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

export function validateRecord(record) {
  const problems = []
  const add = (where, message) => problems.push({ where, message })
  const fm = record.frontmatter ?? {}

  // frontmatter
  if (fm.schema_version !== SCHEMA_VERSION) add('frontmatter.schema_version', `must be ${SCHEMA_VERSION}`)
  if (typeof fm.name !== 'string' || !fm.name.trim()) add('frontmatter.name', 'must be the account name')
  else if (record.title !== undefined && record.title !== fm.name) add('heading', `"# ${record.title}" doesn't match name "${fm.name}"`)
  if (!Array.isArray(fm.domains) || !fm.domains.every((d) => typeof d === 'string')) add('frontmatter.domains', 'must be a list of domains, or []')
  if (!Array.isArray(fm.channels) || !fm.channels.every((c) => c && ['slack', 'telegram', 'teams', 'discord', 'other'].includes(c.type) && typeof c.name === 'string')) {
    add('frontmatter.channels', 'must be a list of {type, name} with type slack, telegram, teams, discord or other, or []')
  }
  if (fm.issue_tracker !== null && !(fm.issue_tracker && ['jira', 'linear', 'github', 'other'].includes(fm.issue_tracker.system) && typeof fm.issue_tracker.key === 'string')) {
    add('frontmatter.issue_tracker', 'must be {system, key} with system jira, linear, github or other, or null')
  }
  for (const key of ['renewal_date', 'last_refreshed']) {
    if (!(key in fm)) add(`frontmatter.${key}`, 'is required (a YYYY-MM-DD date or null)')
    else if (fm[key] !== null && !(typeof fm[key] === 'string' && isRealDate(fm[key]))) add(`frontmatter.${key}`, 'must be a YYYY-MM-DD date or null')
  }
  if (!fm.last_contact || typeof fm.last_contact !== 'object' || Array.isArray(fm.last_contact)) {
    add('frontmatter.last_contact', 'must be a map of email/call/chat to dates, or {}')
  } else {
    for (const [kind, date] of Object.entries(fm.last_contact)) {
      if (!['email', 'call', 'chat'].includes(kind)) add(`frontmatter.last_contact.${kind}`, 'unknown kind (use email, call or chat)')
      else if (typeof date !== 'string' || !isRealDate(date)) add(`frontmatter.last_contact.${kind}`, 'must be a YYYY-MM-DD date')
    }
  }
  if (fm.sources !== undefined) {
    if (!fm.sources || typeof fm.sources !== 'object' || Array.isArray(fm.sources)) add('frontmatter.sources', 'must be a map like {meeting_notes: off}')
    else {
      for (const [source, value] of Object.entries(fm.sources)) {
        if (!SOURCES.includes(source)) add(`frontmatter.sources.${source}`, `unknown source (use ${SOURCES.join(', ')})`)
        else if (value !== 'off' && value !== false) add(`frontmatter.sources.${source}`, 'the only allowed value is off')
      }
    }
  }

  // tables
  const checkRows = (rows, section, checks) =>
    (rows ?? []).forEach((row, i) => {
      for (const [key, test, message] of checks) {
        if (!test(row[key] ?? '')) add(`${section} row ${i + 1} (${row.id ?? row.name ?? row.date ?? ''}) ${key}`, message)
      }
    })
  const oneOf = (...values) => (v) => values.includes(v)
  const dateOrUnknown = (v) => v === 'unknown' || isRealDate(v)
  const nonEmpty = (v) => v.trim() !== ''

  checkRows(record.stakeholders, 'Stakeholders', [
    ['name', nonEmpty, 'is required'],
    ['champion', oneOf('yes', 'no'), 'must be yes or no'],
    ['status', oneOf('active', 'left', 'unknown'), 'must be active, left or unknown'],
    ['lastSeen', dateOrUnknown, 'must be a YYYY-MM-DD date or unknown'],
  ])
  const activeChampions = (record.stakeholders ?? []).filter((s) => s.champion === 'yes' && s.status === 'active')
  if (activeChampions.length > 1) add('Stakeholders', `more than one active champion: ${activeChampions.map((s) => s.name).join(', ')}`)

  checkRows(record.commitments, 'Commitments', [
    ['id', (v) => /^C-\d{3,}$/.test(v), 'must look like C-001'],
    ['commitment', nonEmpty, 'is required'],
    ['owner', oneOf('us', 'them'), 'must be us or them'],
    ['due', dateOrUnknown, 'must be a YYYY-MM-DD date or unknown'],
    ['status', oneOf('open', 'done', 'dropped'), 'must be open, done or dropped'],
  ])
  checkRows(record.issues, 'Issues', [
    ['id', nonEmpty, 'is required'],
    ['issue', nonEmpty, 'is required'],
    ['opened', dateOrUnknown, 'must be a YYYY-MM-DD date or unknown'],
    ['status', oneOf('open', 'blocked', 'resolved'), 'must be open, blocked or resolved'],
  ])
  checkRows(record.timeline, 'Timeline', [
    ['date', isRealDate, 'must be a YYYY-MM-DD date'],
    ['type', oneOf('call', 'email', 'chat', 'meeting', 'note'), 'must be call, email, chat, meeting or note'],
    ['summary', nonEmpty, 'is required'],
  ])
  for (const [section, rows] of [
    ['Commitments', record.commitments],
    ['Issues', record.issues],
  ]) {
    const seen = new Set()
    for (const row of rows ?? []) {
      if (seen.has(row.id)) add(section, `duplicate ID ${row.id}`)
      seen.add(row.id)
    }
  }
  return problems
}

// --- the store ---

export class AccountStore {
  constructor(dataDir = defaultDataDir()) {
    this.dataDir = dataDir
  }

  #path(slug) {
    assertSlug(slug)
    return join(this.dataDir, `${slug}.md`)
  }

  #fileVersion(path) {
    if (!existsSync(path)) return null
    const { ino, mtimeMs, size } = statSync(path)
    return `${ino}:${mtimeMs}:${size}`
  }

  // Account names (file names without .md), sorted. Skips the settings file,
  // dotfiles, non-markdown files and names that aren't valid account names.
  listSlugs() {
    if (!existsSync(this.dataDir)) return []
    return readdirSync(this.dataDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== SETTINGS_FILE)
      .map((entry) => entry.name.slice(0, -3))
      .filter((slug) => SLUG.test(slug))
      .sort()
  }

  exists(slug) {
    return existsSync(this.#path(slug))
  }

  read(slug) {
    const path = this.#path(slug)
    if (!existsSync(path)) {
      const error = new Error(`No account record "${slug}" (expected ${slug}.md in ${this.dataDir})`)
      error.code = 'ENOENT'
      throw error
    }
    const version = this.#fileVersion(path)
    const record = parseRecord(readFileSync(path, 'utf-8'), { file: `${slug}.md`, slug })
    Object.defineProperty(record, FILE_VERSION, { value: version, enumerable: false })
    return record
  }

  // Reads every account; a record that can't be parsed is reported, not thrown, so one
  // broken file doesn't take down list_accounts or triage.
  readAll() {
    const records = []
    const errors = []
    for (const slug of this.listSlugs()) {
      try {
        records.push(this.read(slug))
      } catch (error) {
        errors.push({ slug, message: error.message })
      }
    }
    return { records, errors }
  }

  // Writes a record. Refuses one with value problems. If the record came from read(),
  // refuses to overwrite a file that changed on disk since (pass {expectNew: true}
  // to create a new account, which refuses if the file already exists).
  write(record, { expectNew = false } = {}) {
    const slug = record.slug
    const path = this.#path(slug)
    const problems = validateRecord(record)
    if (problems.length) throw new RecordInvalidError(slug, problems)

    const current = this.#fileVersion(path)
    if (expectNew) {
      if (current !== null) throw new Error(`An account record "${slug}" already exists`)
    } else if (record[FILE_VERSION] !== undefined && record[FILE_VERSION] !== current) {
      throw new RecordConflictError(slug)
    }

    const text = serializeRecord(record)
    parseRecord(text, { file: `${slug}.md`, slug }) // never write something we can't read back

    mkdirSync(this.dataDir, { recursive: true, mode: 0o700 })
    const tmp = join(this.dataDir, `.${slug}.md.${process.pid}.tmp`)
    writeFileSync(tmp, text, { mode: 0o600 })
    renameSync(tmp, path)

    const written = this.read(slug)
    return written
  }
}
