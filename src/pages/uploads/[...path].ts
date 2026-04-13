import type { APIRoute } from 'astro'
import fs from 'node:fs'
import path from 'node:path'
import { DATA_DIR } from '@db/index'

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

export const GET: APIRoute = ({ params }) => {
  const filePath = path.join(DATA_DIR, 'uploads', params.path ?? '')
  const resolved = path.resolve(filePath)

  // Prevent directory traversal
  if (!resolved.startsWith(path.resolve(DATA_DIR, 'uploads'))) {
    return new Response('Forbidden', { status: 403 })
  }

  if (!fs.existsSync(resolved)) {
    return new Response('Not Found', { status: 404 })
  }

  const ext = path.extname(resolved).toLowerCase()
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'
  const file = fs.readFileSync(resolved)

  return new Response(file, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
