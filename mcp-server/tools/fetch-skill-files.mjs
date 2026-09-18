import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { SKILLS_DIR } from '../registry.mjs'

const DESCRIPTION =
  "Fetch the text of a skill's bundled reference/asset files (the ones read_skill " +
  "listed). Input: the skill's name plus one or more of those exact file paths — " +
  'never invent a path. Returns each file\'s content, separated by "---" headers.'

export function registerFetchSkillFilesTool(server, getIndexes) {
  server.registerTool(
    'fetch_skill_files',
    {
      title: 'Fetch Skill Reference Files',
      description: DESCRIPTION,
      inputSchema: z.object({
        skill_name: z.string().min(1),
        file_paths: z.array(z.string().min(1)).min(1),
      }),
    },
    async ({ skill_name: skillName, file_paths: filePaths }) => {
      const skill = getIndexes().skillsByName.get(skillName)
      if (!skill) {
        throw new Error(`Skill '${skillName}' not found. Use search_skills to find valid names.`)
      }

      const invalidPaths = filePaths.filter((path) => !skill.files.includes(path))
      if (invalidPaths.length > 0) {
        throw new Error(
          `Invalid file path(s) for '${skillName}': ${invalidPaths.join(', ')}. ` +
            'Only paths from read_skill\'s reference_files list are valid.',
        )
      }

      const sections = filePaths.map((path) => {
        try {
          const text = readFileSync(join(SKILLS_DIR, skill.path, path), 'utf-8')
          return `--- ${path} ---\n${text}`
        } catch {
          return `--- ${path} ---\n[couldn't read this file]`
        }
      })

      return { content: [{ type: 'text', text: sections.join('\n\n') }] }
    },
  )
}
