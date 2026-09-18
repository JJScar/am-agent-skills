// Loads skills-registry.json once per process and builds the in-memory lookups the
// tools need: a name -> entry map for exact lookups, and a Fuse index for
// natural-language search. Paths are resolved off import.meta.url (not
// process.cwd()) so this works under `npx` regardless of the caller's cwd.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Fuse from 'fuse.js'
import { stripNegativeScope, summarizeDescription } from '../tools/lib/skills-fs.mjs'

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
export const REGISTRY_FILE = join(PACKAGE_ROOT, 'skills-registry.json')
export const SKILLS_DIR = join(PACKAGE_ROOT, 'skills')

export function loadRegistry() {
  return JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'))
}

// Fuse indexes `searchText` (summary + "Use when" triggers, negative-scope clause
// dropped) rather than the raw description — see docs/target-agent-decision.md and
// the AM-018 plan for why: the negative-scope clause names other skills' categories,
// which would otherwise leak into this skill's own index and cause cross-skill false
// matches. `ignoreLocation`/`useTokenSearch` matter too: the trigger phrases sit deep
// enough into the description that Fuse's default location/distance scoring would
// otherwise penalize a real match just for occurring "too far into" the field.
export function buildIndexes(registry) {
  const skillsByName = new Map(registry.skills.map((skill) => [skill.name, skill]))

  const searchEntries = registry.skills.map((skill) => ({
    name: skill.name,
    category: skill.category,
    usageHint: summarizeDescription(skill.description),
    searchText: stripNegativeScope(skill.description),
  }))

  const fuse = new Fuse(searchEntries, {
    keys: [
      { name: 'name', weight: 0.45 },
      { name: 'searchText', weight: 0.4 },
      { name: 'category', weight: 0.15 },
    ],
    threshold: 0.3,
    includeScore: true,
    useTokenSearch: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  })

  return { skillsByName, fuse }
}
