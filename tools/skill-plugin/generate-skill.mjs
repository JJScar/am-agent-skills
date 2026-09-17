#!/usr/bin/env node
// Scaffolds a new skills/<category>/<skill-name>/SKILL.md from name + category + description.
// Plain Node script per AM-009 / ARCHITECTURE.md §5 ("a script, or later an Nx/Plop generator —
// not yet"). Output must pass tools/validate-skills.mjs on the first try with no manual
// frontmatter edits — only the body sections are left for the author to fill in.
//
// Usage:
//   node tools/skill-plugin/generate-skill.mjs <name> <category> "<description>" [options]
//
// Options:
//   --author <name>            defaults to "Unnamed"
//   --version <semver>         defaults to "1.0.0"
//   --audience <a>             technical | non-technical | both (defaults to "technical")
//   --with-references          create an empty references/ folder
//   --with-scripts             create an empty scripts/ folder
//   --with-assets              create an empty assets/ folder

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SKILLS_DIR, loadCategoryMetadata } from '../lib/skills-fs.mjs'

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const VALID_AUDIENCES = ['technical', 'non-technical', 'both']

function toKebabCase(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toTitleCase(kebabName) {
  return kebabName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function parseArgs(argv) {
  const positional = []
  const options = {
    author: 'Unnamed',
    version: '1.0.0',
    audience: 'technical',
    withReferences: false,
    withScripts: false,
    withAssets: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '--author':
        options.author = argv[++i]
        break
      case '--version':
        options.version = argv[++i]
        break
      case '--audience':
        options.audience = argv[++i]
        break
      case '--with-references':
        options.withReferences = true
        break
      case '--with-scripts':
        options.withScripts = true
        break
      case '--with-assets':
        options.withAssets = true
        break
      default:
        positional.push(arg)
    }
  }

  const [name, category, description] = positional
  return { name, category, description, ...options }
}

function fail(message) {
  console.error(`Error: ${message}`)
  process.exitCode = 1
  return null
}

function buildSkillMd({ folderName, title, description, author, version, audience }) {
  return `---
name: ${folderName}
description: >-
  ${description}
metadata:
  version: ${version}
  author: ${author}
  audience: ${audience}
---

# ${title}

<!-- TODO: what this skill does and the outcome it produces. -->

## Process

<!-- TODO: the steps to follow. -->

## Examples

<!-- TODO: a worked example. -->
`
}

function main() {
  const { name, category, description, author, version, audience, withReferences, withScripts, withAssets } =
    parseArgs(process.argv.slice(2))

  if (!name || !category || !description) {
    return fail(
      'usage: node tools/skill-plugin/generate-skill.mjs <name> <category> "<description>" [options]',
    )
  }

  const folderName = toKebabCase(name)
  if (!KEBAB_CASE.test(folderName)) {
    return fail(`could not derive a valid kebab-case name from "${name}"`)
  }

  const categories = loadCategoryMetadata()
  if (!Object.prototype.hasOwnProperty.call(categories, category)) {
    return fail(
      `category "${category}" is not one of the locked categories: ${Object.keys(categories).join(', ')}`,
    )
  }

  if (/[<>]/.test(description)) {
    return fail('description contains angle brackets ("<" or ">"), which are not allowed')
  }
  if (!/use when/i.test(description)) {
    return fail('description must include a "Use when ..." clause (see docs/project-docs/ARCHITECTURE.md §2)')
  }
  if (!/do not use for/i.test(description)) {
    return fail('description must include a "Do NOT use for ..." clause (see docs/project-docs/ARCHITECTURE.md §2)')
  }

  if (!VALID_AUDIENCES.includes(audience)) {
    return fail(`--audience must be one of ${VALID_AUDIENCES.join(' | ')}, got "${audience}"`)
  }

  const skillDir = join(SKILLS_DIR, category, folderName)
  if (existsSync(join(skillDir, 'SKILL.md'))) {
    return fail(`a skill already exists at ${skillDir}`)
  }

  mkdirSync(skillDir, { recursive: true })
  writeFileSync(
    join(skillDir, 'SKILL.md'),
    buildSkillMd({ folderName, title: toTitleCase(folderName), description, author, version, audience }),
  )

  if (withReferences) mkdirSync(join(skillDir, 'references'), { recursive: true })
  if (withScripts) mkdirSync(join(skillDir, 'scripts'), { recursive: true })
  if (withAssets) mkdirSync(join(skillDir, 'assets'), { recursive: true })

  console.log(`Created ${skillDir}/SKILL.md`)
  console.log('Next: fill in the body sections, then run `npm run validate` and `npm run generate:registry`.')
}

main()
