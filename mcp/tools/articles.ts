import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { db, schema } from '../../src/db/index.js'
import { eq, desc } from 'drizzle-orm'

export function registerArticlesTools(server: McpServer) {
  server.tool(
    'list_articles',
    '列出所有思考文章，可按主题筛选',
    {
      topic: z.enum(['engineering', 'ai-practice', 'career', 'life']).optional(),
    },
    async ({ topic }) => {
      let results = db.select().from(schema.articles).orderBy(desc(schema.articles.createdAt)).all()
      if (topic) results = results.filter(a => a.topic === topic)
      return { content: [{ type: 'text' as const, text: JSON.stringify(results.map(({ content, ...rest }) => rest), null, 2) }] }
    }
  )

  server.tool(
    'get_article',
    '获取指定文章的完整内容',
    { slug: z.string() },
    async ({ slug }) => {
      const article = db.select().from(schema.articles).where(eq(schema.articles.slug, slug)).get()
      if (!article) return { content: [{ type: 'text' as const, text: `Article "${slug}" not found` }] }
      return { content: [{ type: 'text' as const, text: JSON.stringify(article, null, 2) }] }
    }
  )

  server.tool(
    'create_article',
    '创建新思考文章',
    {
      slug: z.string().regex(/^[a-z0-9-]+$/),
      title: z.string(),
      topic: z.enum(['engineering', 'ai-practice', 'career', 'life']),
      summary: z.string(),
      content: z.string(),
      cover: z.string().optional(),
      featured: z.boolean().default(false),
    },
    async (params) => {
      const existing = db.select().from(schema.articles).where(eq(schema.articles.slug, params.slug)).get()
      if (existing) return { content: [{ type: 'text' as const, text: `Article "${params.slug}" already exists` }] }

      const now = new Date().toISOString()
      const result = db.insert(schema.articles).values({ ...params, createdAt: now, updatedAt: now }).returning().get()
      return { content: [{ type: 'text' as const, text: `✅ Article "${params.title}" created (id: ${result.id})` }] }
    }
  )

  server.tool(
    'update_article',
    '更新文章。只传需要修改的字段',
    {
      slug: z.string(),
      title: z.string().optional(),
      topic: z.enum(['engineering', 'ai-practice', 'career', 'life']).optional(),
      summary: z.string().optional(),
      content: z.string().optional(),
      cover: z.string().optional(),
      featured: z.boolean().optional(),
    },
    async ({ slug, ...updates }) => {
      const fields: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) fields[k] = v
      }
      if (Object.keys(fields).length === 0) return { content: [{ type: 'text' as const, text: 'No fields to update' }] }

      fields.updatedAt = new Date().toISOString()
      const result = db.update(schema.articles).set(fields).where(eq(schema.articles.slug, slug)).returning().get()
      if (!result) return { content: [{ type: 'text' as const, text: `Article "${slug}" not found` }] }
      return { content: [{ type: 'text' as const, text: `✅ Article "${slug}" updated` }] }
    }
  )

  server.tool(
    'delete_article',
    '删除文章。首次调用返回摘要，confirm=true 执行删除',
    {
      slug: z.string(),
      confirm: z.boolean().default(false),
    },
    async ({ slug, confirm }) => {
      const article = db.select().from(schema.articles).where(eq(schema.articles.slug, slug)).get()
      if (!article) return { content: [{ type: 'text' as const, text: `Article "${slug}" not found` }] }

      if (!confirm) {
        return { content: [{ type: 'text' as const, text: `⚠️ About to delete:\n\nTitle: ${article.title}\nTopic: ${article.topic}\n\nCall again with confirm=true to proceed.` }] }
      }

      db.delete(schema.articles).where(eq(schema.articles.slug, slug)).run()
      return { content: [{ type: 'text' as const, text: `✅ Article "${slug}" deleted` }] }
    }
  )
}
