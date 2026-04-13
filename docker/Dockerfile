FROM node:22-slim AS builder

WORKDIR /app
RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY . .
RUN pnpm build

FROM node:22-slim AS runner

WORKDIR /app
RUN corepack enable pnpm

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/mcp ./mcp

RUN mkdir -p /app/data/uploads/works \
             /app/data/uploads/thinking \
             /app/data/uploads/global \
             /app/data/backups

ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

CMD ["sh", "-c", "node --import tsx src/db/seed.ts 2>/dev/null; node dist/server/entry.mjs"]
