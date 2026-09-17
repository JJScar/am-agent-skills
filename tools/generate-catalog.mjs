#!/usr/bin/env node
// Reads skills-registry.json and emits docs/CATALOG.md: every skill grouped by
// category, with a one-line description and a direct link to its SKILL.md.
// Not hand-maintained — regenerate with `npm run generate:catalog` whenever the
// registry changes. See docs/project-docs/ARCHITECTURE.md §6 layer 2.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const REGISTRY_FILE = 'skills-registry.json'
const OUTPUT_FILE = 'docs/CATALOG.md'

// The registry description is the full validator-required text (a summary
// sentence plus "Use when ..." / "Do NOT use for ..." clauses). The catalog
// only wants the summary, so take everything before the "Use when" clause.
function oneLineSummary(description) {
  const [summary] = description.split(/\.\s+use when/i)
  const trimmed = summary.trim()
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`
}

function loadRegistry() {
  if (!existsSync(REGISTRY_FILE)) {
    throw new Error(`${REGISTRY_FILE} not found — run "npm run generate:registry" first`)
  }
  return JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'))
}

function renderCatalog({ categories, skills }) {
  const lines = [
    '# Skill Catalog',
    '',
    'Generated from `skills-registry.json` — do not edit by hand. Run `npm run generate:catalog` to regenerate.',
    '',
  ]

  for (const [categoryKey, categoryMeta] of Object.entries(categories)) {
    const categorySkills = skills.filter((skill) => skill.category === categoryKey)

    lines.push(`## ${categoryMeta.name}`, '', categoryMeta.description, '')

    if (categorySkills.length === 0) {
      lines.push('_No skills yet._', '')
      continue
    }

    for (const skill of categorySkills) {
      const link = `../skills/${skill.path}/SKILL.md`
      lines.push(`- [**${skill.name}**](${link}) — ${oneLineSummary(skill.description)}`)
    }
    lines.push('')
  }

  return `${lines.join('\n').trimEnd()}\n`
}

function main() {
  const registry = loadRegistry()
  const catalog = renderCatalog(registry)
  writeFileSync(OUTPUT_FILE, catalog)
  console.log(`Wrote ${OUTPUT_FILE}: ${registry.skills.length} skill(s) across ${Object.keys(registry.categories).length} categories.`)
}

main()
