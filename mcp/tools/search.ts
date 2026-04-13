import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { db, schema } from '../../src/db/index.js'
import { like, or } from 'drizzle-orm'

export function registerSearchTools(server: McpServer) {
  server.tool(
    'search_content',
    '全站内容关键词搜索',
    {
      query: z.string().describe('搜索关键词'),
      type: z.enum(['works', 'thinking', 'all']).default('all'),
    },
    async ({ query, type }) => {
      const pattern = `%${query}%`
      const results: Array<{ type: string; slug: string; title: string; excerpt: string }> = []

      if (type === 'all' || type === 'works') {
        const works = db.select().from(schema.works).where(
          or(like(schema.works.title, pattern), like(schema.works.subtitle, pattern), like(schema.works.content, pattern))
        ).all()
        for (const w of works) {
          results.push({ type: 'work', slug: w.slug, title: w.title, excerpt: w.subtitle })
        }
      }

      if (type === 'all' || type === 'thinking') {
        const articles = db.select().from(schema.articles).where(
          or(like(schema.articles.title, pattern), like(schema.articles.summary, pattern), like(schema.articles.content, pattern))
        ).all()
        for (const a of articles) {
          results.push({ type: 'article', slug: a.slug, title: a.title, excerpt: a.summary })
        }
      }

      return { content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }] }
    }
  )
}
