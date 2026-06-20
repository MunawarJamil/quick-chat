FROM node:lts-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm nx build quick-chat-api


FROM node:lts-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN corepack enable

COPY --from=builder /app/apps/quick-chat-api/dist ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

CMD ["node", "main.js"]
