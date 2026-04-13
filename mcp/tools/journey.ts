import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { db, schema } from '../../src/db/index.js'
import { eq, asc, max } from 'drizzle-orm'

export function registerJourneyTools(server: McpServer) {
  server.tool(
    'get_journey',
    '获取完整旅程时间线数据',
    {},
    async () => {
      const nodes = db.select().from(schema.journeyNodes).orderBy(asc(schema.journeyNodes.sortOrder)).all()
      return { content: [{ type: 'text' as const, text: JSON.stringify(nodes, null, 2) }] }
    }
  )

  server.tool(
    'add_journey_node',
    '添加旅程节点',
    {
      period: z.string(),
      role: z.string(),
      organization: z.string().optional(),
      summary: z.string(),
      milestones: z.array(z.string()),
      insight: z.string(),
      position: z.enum(['start', 'end']).default('end'),
    },
    async ({ position, ...params }) => {
      const now = new Date().toISOString()
      const nodes = db.select().from(schema.journeyNodes).all()
      const sortOrder = position === 'start'
        ? (nodes.length > 0 ? Math.min(...nodes.map(n => n.sortOrder)) - 1 : 0)
        : (nodes.length > 0 ? Math.max(...nodes.map(n => n.sortOrder)) + 1 : 0)

      const result = db.insert(schema.journeyNodes).values({
        ...params,
        sortOrder,
        createdAt: now,
        updatedAt: now,
      }).returning().get()
      return { content: [{ type: 'text' as const, text: `✅ Journey node "${params.role}" added (id: ${result.id})` }] }
    }
  )

  server.tool(
    'update_journey_node',
    '更新旅程节点',
    {
      id: z.number().describe('节点 ID'),
      period: z.string().optional(),
      role: z.string().optional(),
      organization: z.string().optional(),
      summary: z.string().optional(),
      milestones: z.array(z.string()).optional(),
      insight: z.string().optional(),
      sortOrder: z.number().optional(),
    },
    async ({ id, ...updates }) => {
      const fields: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) fields[k] = v
      }
      if (Object.keys(fields).length === 0) return { content: [{ type: 'text' as const, text: 'No fields to update' }] }

      fields.updatedAt = new Date().toISOString()
      const result = db.update(schema.journeyNodes).set(fields).where(eq(schema.journeyNodes.id, id)).returning().get()
      if (!result) return { content: [{ type: 'text' as const, text: `Journey node #${id} not found` }] }
      return { content: [{ type: 'text' as const, text: `✅ Journey node #${id} updated` }] }
    }
  )

  server.tool(
    'delete_journey_node',
    '删除旅程节点。首次调用返回摘要，confirm=true 执行删除',
    {
      id: z.number(),
      confirm: z.boolean().default(false),
    },
    async ({ id, confirm }) => {
      const node = db.select().from(schema.journeyNodes).where(eq(schema.journeyNodes.id, id)).get()
      if (!node) return { content: [{ type: 'text' as const, text: `Journey node #${id} not found` }] }

      if (!confirm) {
        return { content: [{ type: 'text' as const, text: `⚠️ About to delete:\n\nRole: ${node.role}\nPeriod: ${node.period}\n\nCall again with confirm=true to proceed.` }] }
      }

      db.delete(schema.journeyNodes).where(eq(schema.journeyNodes.id, id)).run()
      return { content: [{ type: 'text' as const, text: `✅ Journey node #${id} deleted` }] }
    }
  )
}
