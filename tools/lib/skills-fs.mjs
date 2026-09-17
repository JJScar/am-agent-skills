// Shared filesystem/parsing helpers for the skills tooling (validator + registry generator).
// Kept small and dependency-light on purpose — see docs/project-docs/ARCHITECTURE.md §5.

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import yaml from 'js-yaml'

export const SKILLS_DIR = 'skills'
export const CATEGORY_METADATA_FILE = join(SKILLS_DIR, '_category.json')

const IGNORED_ENTRIES = new Set(['.DS_Store'])

export function findSkillDirs() {
  const results = []
  if (!existsSync(SKILLS_DIR)) return results

  for (const categoryEntry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!categoryEntry.isDirectory()) continue
    const categoryPath = join(SKILLS_DIR, categoryEntry.name)

    for (const skillEntry of readdirSync(categoryPath, { withFileTypes: true })) {
      if (!skillEntry.isDirectory()) continue
      results.push({
        category: categoryEntry.name,
        name: skillEntry.name,
        path: join(categoryPath, skillEntry.name),
      })
    }
  }

  return results
}

export function loadCategoryMetadata() {
  if (!existsSync(CATEGORY_METADATA_FILE)) return {}
  return JSON.parse(readFileSync(CATEGORY_METADATA_FILE, 'utf-8'))
}

// Splits a SKILL.md file into its parsed frontmatter and raw body.
// Returns { ok: true, frontmatter, body } or { ok: false, error } — callers
// (validator, registry generator) both need to handle a malformed file, so
// the specific failure reason lives here once instead of twice.
export function parseSkillMd(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { ok: false, error: 'SKILL.md must start with a --- frontmatter block' }
  }

  const [, frontmatterRaw, body] = match
  let frontmatter
  try {
    frontmatter = yaml.load(frontmatterRaw)
  } catch (error) {
    return { ok: false, error: `frontmatter is not valid YAML: ${error.message}` }
  }

  if (!frontmatter || typeof frontmatter !== 'object') {
    return { ok: false, error: 'frontmatter did not parse to an object' }
  }

  return { ok: true, frontmatter, body }
}

// Relative file paths (posix-style, sorted) inside a skill folder, excluding OS junk.
export function listSkillFiles(skillDir) {
  const files = []

  function walk(currentDir, prefix) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (IGNORED_ENTRIES.has(entry.name) || entry.name.startsWith('.')) continue
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        walk(join(currentDir, entry.name), relativePath)
      } else {
        files.push(relativePath)
      }
    }
  }

  walk(skillDir, '')
  return files.sort()
}

// Deterministic SHA-256 over every file's relative path + contents, sorted —
// same approach as the reference repo's computeSkillHash, so re-running this
// on unchanged files always produces the same hash.
export function computeSkillHash(skillDir, files) {
  const hash = createHash('sha256')
  for (const file of files) {
    const filePath = join(skillDir, file)
    if (!existsSync(filePath)) continue
    hash.update(file)
    hash.update(readFileSync(filePath))
  }
  return hash.digest('hex')
}
