import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { parseSkillMd } from '../../tools/lib/skills-fs.mjs'
import { SKILLS_DIR } from '../registry.mjs'

const DESCRIPTION =
  "Read a skill's full instructions. Call this after search_skills with the exact " +
  "name of the best match. Returns the skill's step-by-step instructions to follow, " +
  'plus the names of any bundled reference files. Only fetch a bundled file with ' +
  'fetch_skill_files if the instructions tell you to.'

export function registerReadSkillTool(server, getIndexes) {
  server.registerTool(
    'read_skill',
    {
      title: 'Read Skill Instructions',
      description: DESCRIPTION,
      inputSchema: z.object({ skill_name: z.string().min(1) }),
    },
    async ({ skill_name: skillName }) => {
      const skill = getIndexes().skillsByName.get(skillName)
      if (!skill) {
        throw new Error(`Skill '${skillName}' not found. Use search_skills to find valid names.`)
      }

      let raw
      try {
        raw = readFileSync(join(SKILLS_DIR, skill.path, 'SKILL.md'), 'utf-8')
      } catch {
        throw new Error(`Couldn't read the '${skillName}' skill's files. Try search_skills again.`)
      }

      const parsed = parseSkillMd(raw)
      const instructions = parsed.ok ? parsed.body.trim() : raw

      const content = [{ type: 'text', text: instructions }]
      const referenceFiles = skill.files.filter((file) => file !== 'SKILL.md')
      if (referenceFiles.length > 0) {
        content.push({ type: 'text', text: JSON.stringify({ reference_files: referenceFiles }, null, 2) })
      }

      return { content }
    },
  )
}
