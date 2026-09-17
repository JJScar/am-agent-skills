#!/usr/bin/env node
// Scans every skills/<category>/<skill-name>/SKILL.md and emits skills-registry.json
// at the repo root — the single machine-readable source every distribution layer
// (catalog page, CLI installer, MCP server) reads instead of re-scanning markdown.
// See docs/project-docs/ARCHITECTURE.md §1 and §5. Run: npm run generate:registry

import { readFileSync, writeFileSync } from 'node:fs'
import { computeSkillHash, findSkillDirs, listSkillFiles, loadCategoryMetadata, parseSkillMd } from './lib/skills-fs.mjs'

const OUTPUT_FILE = 'skills-registry.json'
const REGISTRY_VERSION = '1.0.0'

function buildSkillEntry({ category, name, path }) {
  const raw = readFileSync(`${path}/SKILL.md`, 'utf-8')
  const parsed = parseSkillMd(raw)

  if (!parsed.ok) {
    throw new Error(`${category}/${name}: cannot add to registry — ${parsed.error} (run "npm run validate" first)`)
  }

  const { frontmatter, body } = parsed
  const files = listSkillFiles(path)

  return {
    name: frontmatter.name,
    description: frontmatter.description,
    category,
    path: `${category}/${name}`,
    files,
    author: frontmatter.metadata?.author,
    version: frontmatter.metadata?.version,
    audience: frontmatter.metadata?.audience,
    bodyLines: body.replace(/\n$/, '').split('\n').length,
    contentHash: computeSkillHash(path, files),
  }
}

function generateRegistry() {
  const categories = loadCategoryMetadata()
  const skills = findSkillDirs()
    .map(buildSkillEntry)
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    version: REGISTRY_VERSION,
    categories,
    skills,
  }
}

function main() {
  const registry = generateRegistry()
  writeFileSync(OUTPUT_FILE, `${JSON.stringify(registry, null, 2)}\n`)
  console.log(`Wrote ${OUTPUT_FILE}: ${registry.skills.length} skill(s) across ${Object.keys(registry.categories).length} categories.`)
}

main()
