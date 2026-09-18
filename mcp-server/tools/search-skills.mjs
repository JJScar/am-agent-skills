import { z } from 'zod'

const DESCRIPTION =
  'Search the skill catalog by intent. Call this first when an Account Manager asks ' +
  'for help with an account-management task, before assuming no skill applies. ' +
  'Input: a short phrase describing what they need help with (their own words are ' +
  'fine). Returns up to 5 matching skills ranked by relevance. Then call read_skill ' +
  'with the best match\'s name.'

export function registerSearchSkillsTool(server, getIndexes) {
  server.registerTool(
    'search_skills',
    {
      title: 'Search Skills',
      description: DESCRIPTION,
      inputSchema: z.object({ query: z.string().min(1) }),
    },
    async ({ query }) => {
      const { fuse } = getIndexes()
      const hits = fuse.search(query).slice(0, 5)

      const results = hits.map((hit) => ({
        name: hit.item.name,
        category: hit.item.category,
        usage_hint: hit.item.usageHint,
        score: Math.round((1 - (hit.score ?? 0)) * 100),
      }))

      const payload =
        results.length > 0
          ? { results }
          : { results: [], message: 'No matching skill found for that query.' }

      return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] }
    },
  )
}
