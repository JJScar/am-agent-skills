#!/usr/bin/env node
// Builds the files a non-technical AM uploads to their Claude Project (AM-035):
//   templates/claude-project/upload/am-skills.md            — every skill + its reference files, in one file
//   templates/claude-project/upload/account-memory-settings.md — the all-off default settings
// Both are generated so they can't drift from skills/ or docs/source-settings.md.
// Not hand-maintained — regenerate with `npm run build:project-template`; CI checks for drift.
//
// One bundle file instead of one file per skill because every skill is named SKILL.md
// (they'd collide in a Project) and because "upload these 2 files" is a setup step a
// non-technical AM can follow; "upload these 11 files with these names" isn't.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SKILLS_DIR, parseSkillMd } from './lib/skills-fs.mjs'

const REGISTRY_FILE = 'skills-registry.json'
const SETTINGS_DOC = 'docs/source-settings.md'
const OUTPUT_DIR = 'templates/claude-project/upload'
const BUNDLE_FILE = join(OUTPUT_DIR, 'am-skills.md')
const SETTINGS_FILE = join(OUTPUT_DIR, 'account-memory-settings.md')

function loadRegistry() {
  if (!existsSync(REGISTRY_FILE)) {
    throw new Error(`${REGISTRY_FILE} not found — run "npm run generate:registry" first`)
  }
  return JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'))
}

// Pushes every markdown heading down `levels` levels (capped at h6) so a skill's own
// "# Title" nests under the bundle's "# Skill: name". Lines inside ``` fences are left
// alone — the record-format samples contain "# Acme Corp" headings that are data, not
// structure, and must stay byte-identical.
function demoteHeadings(markdown, levels) {
  let inFence = false
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence
        return line
      }
      if (inFence) return line
      const heading = line.match(/^(#{1,6})(\s.*)$/)
      if (!heading) return line
      const depth = Math.min(heading[1].length + levels, 6)
      return `${'#'.repeat(depth)}${heading[2]}`
    })
    .join('\n')
}

function renderSkill(skill) {
  const skillDir = join(SKILLS_DIR, skill.path)
  const parsed = parseSkillMd(readFileSync(join(skillDir, 'SKILL.md'), 'utf-8'))
  if (!parsed.ok) {
    throw new Error(`${skill.path}/SKILL.md: ${parsed.error} — run "npm run validate"`)
  }

  const lines = [
    `# Skill: ${skill.name}`,
    '',
    `**When to use it:** ${skill.description}`,
    '',
    demoteHeadings(parsed.body.trim(), 1),
    '',
  ]

  for (const file of skill.files.filter((f) => f !== 'SKILL.md')) {
    const content = readFileSync(join(skillDir, file), 'utf-8').trim()
    lines.push(`## File: ${file} (part of ${skill.name})`, '', demoteHeadings(content, 2), '')
  }

  return lines.join('\n')
}

function renderBundle({ categories, skills }) {
  const ordered = Object.keys(categories).flatMap((key) => skills.filter((s) => s.category === key))

  const header = [
    '# Account Manager skills',
    '',
    'Generated from the am-skills repo — do not edit by hand. Run `npm run build:project-template` to regenerate.',
    '',
    '## How to use this file',
    '',
    'This file holds several skills, each starting with a `# Skill: <name>` heading and a',
    '"When to use it" line. When the Account Manager asks for something, find the skill whose',
    '"When to use it" matches and follow its instructions. When a skill tells you to read',
    'a file such as `references/record-format.md`, read the `## File: references/record-format.md`',
    'section under that same skill. Links into `docs/` point at the am-skills repo and aren\'t',
    'available here; everything a skill needs is in this file.',
    '',
    `Skills in this file: ${ordered.map((s) => `\`${s.name}\``).join(', ')}.`,
    '',
  ]

  return `${[...header, ...ordered.map(renderSkill)].join('\n').trimEnd()}\n`
}

// The default settings live once, in docs/source-settings.md's "## Default file"
// section — copied out rather than duplicated by hand.
function extractDefaultSettings() {
  const doc = readFileSync(SETTINGS_DOC, 'utf-8')
  const section = doc.split('\n## Default file')[1]
  const block = section && section.match(/```markdown\n([\s\S]*?)\n```/)
  if (!block) {
    throw new Error(`${SETTINGS_DOC}: couldn't find the \`\`\`markdown block under "## Default file"`)
  }
  return `${block[1].trimEnd()}\n`
}

function main() {
  const registry = loadRegistry()
  mkdirSync(OUTPUT_DIR, { recursive: true })
  writeFileSync(BUNDLE_FILE, renderBundle(registry))
  writeFileSync(SETTINGS_FILE, extractDefaultSettings())
  console.log(`Wrote ${BUNDLE_FILE} (${registry.skills.length} skills) and ${SETTINGS_FILE}.`)
}

main()
