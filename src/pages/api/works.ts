import type { APIRoute } from 'astro'
import { db, schema } from '@db/index'
import { eq, desc } from 'drizzle-orm'

export const GET: APIRoute = ({ url }) => {
  const category = url.searchParams.get('category')
  const featured = url.searchParams.get('featured')

  let works = db.select().from(schema.works).orderBy(desc(schema.works.createdAt)).all()
  if (category) works = works.filter(w => w.category === category)
  if (featured === 'true') works = works.filter(w => w.featured)

  return Response.json({ data: works, total: works.length })
}
