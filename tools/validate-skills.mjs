#!/usr/bin/env node
// Validates every skills/<category>/<skill-name>/SKILL.md against the rules in
// docs/project-docs/ARCHITECTURE.md §2 and §5. Run: npm run validate
//
// NOT yet checked here: the data-safety rule (no real customer data — see
// CONTRIBUTING.md) is enforced by PR review and the PR template only. Automating
// it needs a real-vs-fabricated-data heuristic, which isn't obvious to write
// until we've seen what patterns actually show up in review (ticket AM-013).

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findSkillDirs, parseSkillMd } from './lib/skills-fs.mjs'

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_DESCRIPTION_CHARS = 1024
const MAX_BODY_LINES = 500
const VALID_AUDIENCES = ['technical', 'non-technical', 'both']

function findFileExact(dirPath, exactName) {
  return readdirSync(dirPath).find((entry) => entry === exactName)
}

function findFileCaseInsensitive(dirPath, name) {
  return readdirSync(dirPath).find((entry) => entry.toLowerCase() === name.toLowerCase())
}

function findReadmesRecursive(dirPath) {
  const found = []
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      found.push(...findReadmesRecursive(fullPath))
    } else if (entry.name.toLowerCase() === 'readme.md') {
      found.push(fullPath)
    }
  }
  return found
}

function validateSkill({ name, path }) {
  const errors = []

  if (!KEBAB_CASE.test(name)) {
    errors.push(`folder name "${name}" is not kebab-case (lowercase letters, digits, single hyphens only)`)
  }

  const exactMatch = findFileExact(path, 'SKILL.md')
  if (!exactMatch) {
    const caseInsensitiveMatch = findFileCaseInsensitive(path, 'SKILL.md')
    errors.push(
      caseInsensitiveMatch
        ? `found "${caseInsensitiveMatch}" but casing must be exactly "SKILL.md"`
        : 'missing SKILL.md',
    )
    return errors
  }

  for (const readmePath of findReadmesRecursive(path)) {
    errors.push(`stray README.md not allowed inside a skill folder: ${readmePath}`)
  }

  const raw = readFileSync(join(path, 'SKILL.md'), 'utf-8')
  const parsed = parseSkillMd(raw)
  if (!parsed.ok) {
    errors.push(parsed.error)
    return errors
  }
  const { frontmatter, body } = parsed

  if (typeof frontmatter.name !== 'string' || frontmatter.name.length === 0) {
    errors.push('frontmatter is missing required field "name"')
  } else if (frontmatter.name !== name) {
    errors.push(`frontmatter name "${frontmatter.name}" does not match folder name "${name}"`)
  }

  if (typeof frontmatter.description !== 'string' || frontmatter.description.length === 0) {
    errors.push('frontmatter is missing required field "description"')
  } else {
    const description = frontmatter.description
    if (description.length > MAX_DESCRIPTION_CHARS) {
      errors.push(`description is ${description.length} chars, over the ${MAX_DESCRIPTION_CHARS}-char limit`)
    }
    if (/[<>]/.test(description)) {
      errors.push('description contains angle brackets ("<" or ">"), which are not allowed')
    }
    if (!/use when/i.test(description)) {
      errors.push('description is missing a "Use when ..." clause')
    }
    if (!/do not use for/i.test(description)) {
      errors.push('description is missing a "Do NOT use for ..." clause')
    }
  }

  const metadata = frontmatter.metadata
  if (!metadata || typeof metadata !== 'object') {
    errors.push('frontmatter is missing required "metadata" block')
  } else {
    if (typeof metadata.version !== 'string' || metadata.version.length === 0) {
      errors.push('metadata is missing required field "version"')
    }
    if (typeof metadata.author !== 'string' || metadata.author.length === 0) {
      errors.push('metadata is missing required field "author"')
    }
    if (!VALID_AUDIENCES.includes(metadata.audience)) {
      errors.push(`metadata.audience must be one of ${VALID_AUDIENCES.join(' | ')}, got "${metadata.audience}"`)
    }
  }

  const bodyLineCount = body.replace(/\n$/, '').split('\n').length
  if (bodyLineCount > MAX_BODY_LINES) {
    errors.push(`SKILL.md body is ${bodyLineCount} lines, over the ${MAX_BODY_LINES}-line budget`)
  }

  return errors
}

function main() {
  const skills = findSkillDirs()

  if (skills.length === 0) {
    console.log('No skills found under skills/ — nothing to validate.')
    return
  }

  let failCount = 0

  for (const skill of skills) {
    const errors = validateSkill(skill)
    const label = `${skill.category}/${skill.name}`

    if (errors.length === 0) {
      console.log(`OK    ${label}`)
    } else {
      failCount += 1
      console.log(`FAIL  ${label}`)
      for (const error of errors) {
        console.log(`      - ${error}`)
      }
    }
  }

  console.log('')
  if (failCount > 0) {
    console.log(`${failCount} of ${skills.length} skill(s) failed validation.`)
    process.exitCode = 1
  } else {
    console.log(`All ${skills.length} skill(s) passed.`)
  }
}

main()
