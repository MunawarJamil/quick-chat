FROM node:lts-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY . .

RUN pnpm install --frozen-lockfile

# 1. Build the production bundle
RUN pnpm nx build quick-chat-api

# 2. Run the Nx prune targets — generates inside dist/:
#    - package.json   (only the API's direct production deps)
#    - pnpm-lock.yaml (pruned lockfile — no monorepo noise)
#    - workspace_modules/ (local workspace packages the API uses)
RUN pnpm nx run quick-chat-api:prune


FROM node:lts-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN corepack enable

# Copy the entire pruned dist — it already contains:
# main.js, package.json (pruned), pnpm-lock.yaml (pruned), workspace_modules/
COPY --from=builder /app/apps/quick-chat-api/dist ./

# Install ONLY what the pruned lockfile declares
RUN pnpm install --prod --frozen-lockfile

CMD ["node", "main.js"]
