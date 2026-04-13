import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { db, schema, DATA_DIR } from '../../src/db/index.js'
import { eq, and } from 'drizzle-orm'
import fs from 'node:fs'
import path from 'node:path'

const SUPPORTED_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg']
const MAX_SIZE: Record<string, number> = {
  gif: 5 * 1024 * 1024,
  svg: 500 * 1024,
  default: 2 * 1024 * 1024,
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function registerImagesTools(server: McpServer) {
  server.tool(
    'upload_image',
    '上传图片。支持 base64 data URI、URL、本地文件路径',
    {
      image: z.string().describe('图片数据：base64 data URI / URL / 本地绝对路径'),
      target: z.enum(['works', 'thinking', 'global']),
      slug: z.string().optional().describe('target 为 works/thinking 时必填'),
      filename: z.string().regex(/^[a-z0-9-]+\.(png|jpg|jpeg|webp|avif|gif|svg)$/),
      alt: z.string().optional(),
    },
    async ({ image, target, slug, filename, alt }) => {
      if (target !== 'global' && !slug) {
        return { content: [{ type: 'text' as const, text: 'slug is required for works/thinking targets' }] }
      }

      const ext = path.extname(filename).slice(1).toLowerCase()
      if (!SUPPORTED_FORMATS.includes(ext)) {
        return { content: [{ type: 'text' as const, text: `Unsupported format: ${ext}` }] }
      }

      let buffer: Buffer
      if (image.startsWith('data:')) {
        const base64Data = image.split(',')[1]
        buffer = Buffer.from(base64Data, 'base64')
      } else if (image.startsWith('http://') || image.startsWith('https://')) {
        const res = await fetch(image)
        buffer = Buffer.from(await res.arrayBuffer())
      } else {
        if (!fs.existsSync(image)) {
          return { content: [{ type: 'text' as const, text: `File not found: ${image}` }] }
        }
        buffer = fs.readFileSync(image)
      }

      const maxSize = MAX_SIZE[ext] ?? MAX_SIZE.default
      if (buffer.length > maxSize) {
        return { content: [{ type: 'text' as const, text: `Image too large: ${formatBytes(buffer.length)}. Max: ${formatBytes(maxSize)}` }] }
      }

      const relDir = target === 'global' ? 'global' : `${target}/${slug}`
      const dir = path.join(DATA_DIR, 'uploads', relDir)
      fs.mkdirSync(dir, { recursive: true })

      const filePath = path.join(dir, filename)
      fs.writeFileSync(filePath, buffer)

      const url = `/uploads/${relDir}/${filename}`

      const now = new Date().toISOString()
      db.insert(schema.images).values({
        filename,
        path: `${relDir}/${filename}`,
        url,
        target,
        slug: slug ?? null,
        format: ext,
        size: buffer.length,
        alt: alt ?? null,
        createdAt: now,
      }).run()

      return {
        content: [{
          type: 'text' as const,
          text: `✅ Image uploaded\nURL: ${url}\nSize: ${formatBytes(buffer.length)}\n\nUse in content:\n  cover field: "${url}"\n  Markdown: ![${alt ?? ''}](${url})`,
        }],
      }
    }
  )

  server.tool(
    'list_images',
    '列出图片文件',
    {
      target: z.enum(['works', 'thinking', 'global']).optional(),
      slug: z.string().optional(),
    },
    async ({ target, slug }) => {
      let results = db.select().from(schema.images).all()
      if (target) results = results.filter(i => i.target === target)
      if (slug) results = results.filter(i => i.slug === slug)
      return { content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }] }
    }
  )

  server.tool(
    'delete_image',
    '删除图片。首次调用返回摘要，confirm=true 执行删除',
    {
      id: z.number().describe('图片 ID'),
      confirm: z.boolean().default(false),
    },
    async ({ id, confirm }) => {
      const img = db.select().from(schema.images).where(eq(schema.images.id, id)).get()
      if (!img) return { content: [{ type: 'text' as const, text: `Image #${id} not found` }] }

      if (!confirm) {
        return { content: [{ type: 'text' as const, text: `⚠️ About to delete:\n\nFile: ${img.path}\nSize: ${formatBytes(img.size)}\n\nCall again with confirm=true to proceed.` }] }
      }

      const filePath = path.join(DATA_DIR, 'uploads', img.path)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      db.delete(schema.images).where(eq(schema.images.id, id)).run()

      return { content: [{ type: 'text' as const, text: `✅ Image #${id} deleted` }] }
    }
  )
}
