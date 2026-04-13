import { db, schema } from './index'
import { sql } from 'drizzle-orm'

const now = new Date().toISOString()

// Create tables if not exist (bootstrap without migrations)
db.run(sql`CREATE TABLE IF NOT EXISTS works (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  content TEXT NOT NULL,
  cover TEXT,
  cover_alt TEXT,
  repo TEXT,
  live TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  featured INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`)

db.run(sql`CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  cover TEXT,
  cover_alt TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`)

db.run(sql`CREATE TABLE IF NOT EXISTS journey_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sort_order INTEGER NOT NULL,
  period TEXT NOT NULL,
  role TEXT NOT NULL,
  organization TEXT,
  summary TEXT NOT NULL,
  milestones TEXT NOT NULL DEFAULT '[]',
  insight TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`)

db.run(sql`CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  target TEXT NOT NULL,
  slug TEXT,
  format TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt TEXT,
  created_at TEXT NOT NULL
)`)

db.run(sql`CREATE TABLE IF NOT EXISTS site_info (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`)

// Check if already seeded
const existing = db.select().from(schema.works).all()
if (existing.length > 0) {
  console.log('Database already seeded, skipping.')
  process.exit(0)
}

// Seed works
db.insert(schema.works).values([
  {
    slug: 'eden',
    title: 'Eden',
    subtitle: '基于 Obsidian 的博客系统，Markdown 即发布',
    category: 'tool',
    tags: ['Go', 'React', 'Docker', 'Obsidian'],
    content: `## 背景与动机

写作应该是纯粹的。打开编辑器，写下想法，保存，发布。不需要登录后台，不需要富文本编辑器，不需要等待构建。

Eden 让 Obsidian 成为你的博客编辑器。写完一篇笔记，它就是一篇博文。

## 方案与实现

Go 后端负责监听 Obsidian vault 的文件变化，解析 Markdown frontmatter，生成静态页面。React 前端提供阅读体验。Docker 一键部署。

关键设计：
- 文件系统即数据库——没有额外的数据存储
- 增量构建——只处理变化的文件
- 实时预览——WebSocket 推送更新

## 收获与反思

这个项目让我理解了「约束即自由」。选择 Markdown 作为唯一输入格式，反而让整个系统变得极其简单。`,
    status: 'active',
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: 'northstar',
    title: 'Northstar',
    subtitle: '零售经济数据分析工具，16 项统计指标',
    category: 'tool',
    tags: ['Python', 'Data Analysis', 'Pandas'],
    content: `## 背景与动机

零售行业需要快速了解经济趋势对业务的影响。现有工具要么太专业，要么太笼统。Northstar 试图在两者之间找到平衡。

## 方案与实现

基于 Python + Pandas 构建的数据分析管线，从多个公开数据源抓取零售相关经济指标，计算 16 项统计指标，生成可视化报告。

## 收获与反思

数据分析工具的核心不是技术，是「问对问题」。花在理解业务上下文的时间比写代码的时间多得多。`,
    status: 'active',
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: 'confluence-mcp',
    title: 'Confluence MCP',
    subtitle: '让 AI 读写 Confluence 的 MCP Server',
    category: 'ai',
    tags: ['TypeScript', 'MCP', 'Confluence', 'AI'],
    content: `## 背景与动机

企业知识库是 AI 最应该能访问的数据源之一，但 Confluence 的 API 复杂且文档分散。这个 MCP Server 让 AI Agent 能像人一样搜索、阅读、编辑 Confluence 页面。

## 方案与实现

基于 Model Context Protocol 规范，实现了完整的 Confluence CRUD 操作：
- 搜索页面（CQL 查询）
- 读取页面内容（Markdown 格式返回）
- 创建和更新页面
- 管理页面标签

## 收获与反思

MCP 协议的设计哲学和 Unix 管道很像——做好一件事，通过标准接口组合。这种「小工具、大组合」的思路在 AI 时代依然有效。`,
    status: 'active',
    featured: true,
    repo: 'https://github.com/anner/confluence-mcp',
    createdAt: now,
    updatedAt: now,
  },
]).run()

// Seed articles
db.insert(schema.articles).values([
  {
    slug: 'first-principles-engineering',
    title: '第一性原理与工程实践',
    topic: 'engineering',
    summary: '物理是定律，其他都是建议。',
    content: `工程师容易陷入一个陷阱：用现有方案的框架去思考新问题。

第一性原理要求我们回到最基本的事实，从那里重新推导。这不是说要重新发明轮子，而是在做重要决策时，确保我们理解了「为什么」，而不仅仅是「怎么做」。

## 在工程中的应用

当我们选择一个技术方案时，问自己：
1. 这个问题的本质约束是什么？
2. 现有方案解决了哪些约束？忽略了哪些？
3. 如果从零开始，最简单的解法是什么？

很多时候，最简单的解法就是最好的解法。复杂度是工程的敌人。

## 一个实际例子

在设计缓存系统时，团队最初想引入 Redis。但回到第一性原理：我们的读写比是 100:1，数据量不超过 1GB。一个进程内的 LRU Map 就能解决问题，不需要额外的基础设施。

少即是多，不是口号，是工程纪律。`,
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: 'vibe-coding',
    title: 'Vibe Coding：与 AI 协作的新范式',
    topic: 'ai-practice',
    summary: '不是让 AI 写代码，是让 AI 成为你的思考伙伴。',
    content: `Vibe Coding 不是把需求丢给 AI 然后等结果。它是一种协作方式：你提供方向和判断，AI 提供速度和广度。

## 核心原则

1. **你是架构师，AI 是工程师**——你决定做什么、怎么做，AI 帮你实现细节
2. **对话即设计**——和 AI 讨论方案的过程本身就是设计过程
3. **审查是必须的**——AI 生成的代码需要你的判断，不是盲目接受

## 实践心得

最有效的 prompt 不是最详细的，而是最有上下文的。告诉 AI 你在做什么、为什么这样做、之前试过什么，比列出每一步指令更有效。

好的 AI 协作让我写出了比独自工作时更好的代码——不是因为 AI 更聪明，而是因为「解释给别人听」这个动作本身就能澄清思路。`,
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
]).run()

// Seed journey
db.insert(schema.journeyNodes).values([
  {
    sortOrder: 1,
    period: '2022.07 - 至今',
    role: '平台工程师',
    organization: '帆软',
    summary: '构建企业级平台的地基——权限、调度、集群、缓存',
    milestones: [
      '设计并实现三级缓存架构',
      '重构集群调度模块',
      '建立平台性能基准测试体系',
    ],
    insight: '好的基础设施是不可见的。用户不知道它存在，但离开它什么都跑不起来。',
    createdAt: now,
    updatedAt: now,
  },
  {
    sortOrder: 2,
    period: '2024 - 至今',
    role: '独立创造者',
    organization: '',
    summary: '业余时间构建工具、探索 AI 原生开发',
    milestones: [
      '发布 Eden 博客系统',
      '贡献 Confluence MCP Server',
      '实践 Vibe Coding 工作流',
    ],
    insight: '创造的乐趣在于从零到一的过程，而不是结果本身。',
    createdAt: now,
    updatedAt: now,
  },
]).run()

// Seed site info
db.insert(schema.siteInfo).values([
  { key: 'name', value: JSON.stringify('Anner') },
  { key: 'tagline', value: JSON.stringify('构建工具，记录思考。') },
  { key: 'about', value: JSON.stringify('帆软平台工程师，业余独立创造者。白天构建企业级系统的地基——权限、调度、集群、缓存；夜晚探索 AI 原生开发的边界——MCP、Agent、Vibe Coding。相信第一性原理，追求少即是多。') },
  {
    key: 'contact',
    value: JSON.stringify({
      github: 'https://github.com/anner',
      email: 'anner@example.com',
    }),
  },
  {
    key: 'roles',
    value: JSON.stringify([
      '帆软平台工程师 — 权限、调度、集群、缓存',
      '独立创造者 — Eden, Northstar, NotionHub, OpenOctopus',
      'AI 原生开发者 — RAG, Agent 设计, Vibe Coding',
    ]),
  },
]).run()

console.log('✅ Database seeded successfully.')
