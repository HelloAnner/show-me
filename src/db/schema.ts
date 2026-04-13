import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const works = sqliteTable('works', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  category: text('category').notNull(), // tool | platform | ai | opensource | experiment
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull(),
  content: text('content').notNull(),
  cover: text('cover'),
  coverAlt: text('cover_alt'),
  repo: text('repo'),
  live: text('live'),
  status: text('status').notNull().default('active'), // active | archived | experiment
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  topic: text('topic').notNull(), // engineering | ai-practice | career | life
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  cover: text('cover'),
  coverAlt: text('cover_alt'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const journeyNodes = sqliteTable('journey_nodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sortOrder: integer('sort_order').notNull(),
  period: text('period').notNull(),
  role: text('role').notNull(),
  organization: text('organization'),
  summary: text('summary').notNull(),
  milestones: text('milestones', { mode: 'json' }).$type<string[]>().notNull(),
  insight: text('insight').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  path: text('path').notNull(),
  url: text('url').notNull(),
  target: text('target').notNull(), // works | thinking | global
  slug: text('slug'),
  format: text('format').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt'),
  createdAt: text('created_at').notNull(),
})

export const siteInfo = sqliteTable('site_info', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
})
