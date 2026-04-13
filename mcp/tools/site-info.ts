import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { db, schema } from '../../src/db/index.js'
import { eq } from 'drizzle-orm'

export function registerSiteInfoTools(server: McpServer) {
  server.tool(
    'get_site_info',
    '获取站点和站主的基本信息',
    {},
    async () => {
      const rows = db.select().from(schema.siteInfo).all()
      const info: Record<string, unknown> = {}
      for (const row of rows) {
        info[row.key] = JSON.parse(row.value as string)
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(info, null, 2) }] }
    }
  )

  server.tool(
    'update_site_info',
    '更新站点元信息',
    {
      key: z.string().describe('配置键名，如 tagline / about / contact / roles'),
      value: z.any().describe('配置值（任意 JSON 类型）'),
    },
    async ({ key, value }) => {
      const jsonValue = JSON.stringify(value)
      const existing = db.select().from(schema.siteInfo).where(eq(schema.siteInfo.key, key)).get()

      if (existing) {
        db.update(schema.siteInfo).set({ value: jsonValue }).where(eq(schema.siteInfo.key, key)).run()
      } else {
        db.insert(schema.siteInfo).values({ key, value: jsonValue }).run()
      }

      return { content: [{ type: 'text' as const, text: `✅ Site info "${key}" updated` }] }
    }
  )
}
