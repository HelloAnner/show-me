.PHONY: start stop dev build migrate seed backup mcp logs help

# ── 生产环境 ──

start: ## Docker 启动（后台）
	docker compose up -d --build

stop: ## Docker 停止
	docker compose down

logs: ## 查看日志
	docker compose logs -f

# ── 本地开发 ──

dev: ## 本地开发服务器
	pnpm dev

mcp: ## 启动 MCP Server（本地）
	pnpm mcp

# ── 数据库 ──

migrate: ## 执行数据库迁移
	pnpm db:generate && pnpm db:migrate

seed: ## 填充初始数据
	pnpm db:seed

studio: ## 打开 Drizzle Studio
	pnpm db:studio

# ── 运维 ──

backup: ## 备份数据库
	@mkdir -p data/backups
	cp data/showme.db data/backups/showme-$$(date +%Y%m%d-%H%M%S).db
	@echo "✅ Backup saved"

restore: ## 从最新备份恢复
	@latest=$$(ls -t data/backups/*.db 2>/dev/null | head -1); \
	if [ -z "$$latest" ]; then echo "❌ No backup found"; exit 1; fi; \
	cp "$$latest" data/showme.db; \
	echo "✅ Restored from $$latest"

build: ## 构建生产版本
	pnpm build

clean: ## 清理构建产物
	rm -rf dist node_modules/.astro

help: ## 显示帮助
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
