import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'node:path'
import fs from 'node:fs'

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data')

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true })
fs.mkdirSync(path.join(DATA_DIR, 'uploads', 'works'), { recursive: true })
fs.mkdirSync(path.join(DATA_DIR, 'uploads', 'thinking'), { recursive: true })
fs.mkdirSync(path.join(DATA_DIR, 'uploads', 'global'), { recursive: true })
fs.mkdirSync(path.join(DATA_DIR, 'backups'), { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'showme.db')
const sqlite = new Database(DB_PATH)

sqlite.pragma('journal_mode = WAL')
sqlite.pragma('busy_timeout = 5000')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
export { schema }
export { DATA_DIR }
