import type { APIRoute } from 'astro'
import { db, schema } from '@db/index'
import { like, or } from 'drizzle-orm'

export const GET: APIRoute = ({ url }) => {
  const q = url.searchParams.get('q')?.trim()
  if (!q) return Response.json({ data: [], total: 0 })

  const pattern = `%${q}%`

  const works = db.select({
    slug: schema.works.slug,
    title: schema.works.title,
    subtitle: schema.works.subtitle,
  }).from(schema.works).where(
    or(
      like(schema.works.title, pattern),
      like(schema.works.subtitle, pattern),
      like(schema.works.content, pattern),
    )
  ).all().map(w => ({ ...w, type: 'work' as const }))

  const articles = db.select({
    slug: schema.articles.slug,
    title: schema.articles.title,
    subtitle: schema.articles.summary,
  }).from(schema.articles).where(
    or(
      like(schema.articles.title, pattern),
      like(schema.articles.summary, pattern),
      like(schema.articles.content, pattern),
    )
  ).all().map(a => ({ ...a, type: 'article' as const }))

  const results = [...works, ...articles]
  return Response.json({ data: results, total: results.length })
}
