import type { APIRoute } from 'astro'
import { db, schema } from '@db/index'
import { desc } from 'drizzle-orm'

export const GET: APIRoute = ({ url }) => {
  const topic = url.searchParams.get('topic')

  let articles = db.select().from(schema.articles).orderBy(desc(schema.articles.createdAt)).all()
  if (topic) articles = articles.filter(a => a.topic === topic)

  return Response.json({ data: articles, total: articles.length })
}
