import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { db, schema } from '../../src/db/index.js'
import { eq, desc, and } from 'drizzle-orm'

export function registerWorksTools(server: McpServer) {
  server.tool(
    'list_works',
    '列出所有作品，可按分类和状态筛选',
    {
      category: z.enum(['tool', 'platform', 'ai', 'opensource', 'experiment']).optional().describe('按分类筛选'),
      status: z.enum(['active', 'archived', 'experiment']).optional().describe('按状态筛选'),
      featured_only: z.boolean().optional().describe('仅返回精选作品'),
    },
    async ({ category, status, featured_only }) => {
      let results = db.select().from(schema.works).orderBy(desc(schema.works.createdAt)).all()
      if (category) results = results.filter(w => w.category === category)
      if (status) results = results.filter(w => w.status === status)
      if (featured_only) results = results.filter(w => w.featured)
      return { content: [{ type: 'text' as const, text: JSON.stringify(results.map(({ content, ...rest }) => rest), null, 2) }] }
    }
  )

  server.tool(
    'get_work',
    '获取指定作品的完整数据，包括 Markdown 正文',
    { slug: z.string().describe('作品的 slug 标识') },
    async ({ slug }) => {
      const work = db.select().from(schema.works).where(eq(schema.works.slug, slug)).get()
      if (!work) return { content: [{ type: 'text' as const, text: `Work "${slug}" not found` }] }
      return { content: [{ type: 'text' as const, text: JSON.stringify(work, null, 2) }] }
    }
  )

  server.tool(
    'create_work',
    '创建新作品',
    {
      slug: z.string().regex(/^[a-z0-9-]+$/).describe('作品 slug'),
      title: z.string(),
      subtitle: z.string(),
      category: z.enum(['tool', 'platform', 'ai', 'opensource', 'experiment']),
      tags: z.array(z.string()),
      content: z.string().describe('Markdown 正文'),
      cover: z.string().optional(),
      repo: z.string().optional(),
      live: z.string().optional(),
      status: z.enum(['active', 'archived', 'experiment']).default('active'),
      featured: z.boolean().default(false),
    },
    async (params) => {
      const existing = db.select().from(schema.works).where(eq(schema.works.slug, params.slug)).get()
      if (existing) return { content: [{ type: 'text' as const, text: `Work "${params.slug}" already exists` }] }

      const now = new Date().toISOString()
      const result = db.insert(schema.works).values({ ...params, createdAt: now, updatedAt: now }).returning().get()
      return { content: [{ type: 'text' as const, text: `✅ Work "${params.title}" created (id: ${result.id})` }] }
    }
  )

  server.tool(
    'update_work',
    '更新作品。只传需要修改的字段',
    {
      slug: z.string().describe('要更新的作品 slug'),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      category: z.enum(['tool', 'platform', 'ai', 'opensource', 'experiment']).optional(),
      tags: z.array(z.string()).optional(),
      content: z.string().optional(),
      cover: z.string().optional(),
      repo: z.string().optional(),
      live: z.string().optional(),
      status: z.enum(['active', 'archived', 'experiment']).optional(),
      featured: z.boolean().optional(),
    },
    async ({ slug, ...updates }) => {
      const fields: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) fields[k] = v
      }
      if (Object.keys(fields).length === 0) return { content: [{ type: 'text' as const, text: 'No fields to update' }] }

      fields.updatedAt = new Date().toISOString()
      const result = db.update(schema.works).set(fields).where(eq(schema.works.slug, slug)).returning().get()
      if (!result) return { content: [{ type: 'text' as const, text: `Work "${slug}" not found` }] }
      return { content: [{ type: 'text' as const, text: `✅ Work "${slug}" updated. Changed: ${Object.keys(fields).filter(k => k !== 'updatedAt').join(', ')}` }] }
    }
  )

  server.tool(
    'delete_work',
    '删除作品。首次调用返回摘要，confirm=true 执行删除',
    {
      slug: z.string(),
      confirm: z.boolean().default(false),
    },
    async ({ slug, confirm }) => {
      const work = db.select().from(schema.works).where(eq(schema.works.slug, slug)).get()
      if (!work) return { content: [{ type: 'text' as const, text: `Work "${slug}" not found` }] }

      if (!confirm) {
        return { content: [{ type: 'text' as const, text: `⚠️ About to delete:\n\nTitle: ${work.title}\nSubtitle: ${work.subtitle}\n\nCall again with confirm=true to proceed.` }] }
      }

      db.delete(schema.works).where(eq(schema.works.slug, slug)).run()
      return { content: [{ type: 'text' as const, text: `✅ Work "${slug}" deleted` }] }
    }
  )
}
