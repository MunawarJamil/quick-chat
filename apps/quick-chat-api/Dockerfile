FROM node:lts-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV PNPM_STORE_DIR=/pnpm/store
RUN corepack enable

# 1. Copy workspace definitions and package manifests first for Docker layer caching
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/quick-chat-api/package.json ./apps/quick-chat-api/
COPY apps/quick-chat-api-e2e/package.json ./apps/quick-chat-api-e2e/
COPY prisma/package.json ./prisma/
COPY shared/quick-chat-shared-types/package.json ./shared/quick-chat-shared-types/
COPY shared/quick-chat-shared-utils/package.json ./shared/quick-chat-shared-utils/

# 2. Install workspace dependencies (cached as long as package manifests don't change)
RUN pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# 3. Copy the rest of the workspace source files
COPY . .

# 4. Generate Prisma client
RUN pnpm exec prisma generate

# 5. Build the production bundle
RUN pnpm nx build quick-chat-api

# 6. Run the Nx prune targets — generates inside dist/:
#    - package.json   (only the API's direct production deps)
#    - pnpm-lock.yaml (pruned lockfile — no monorepo noise)
#    - workspace_modules/ (local workspace packages the API uses)
RUN pnpm nx run quick-chat-api:prune


FROM node:lts-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Install runtime libraries needed by Prisma and health check
RUN apk add --no-cache openssl libc6-compat wget curl

# Copy node_modules directly from builder (0 network downloads)
COPY --from=builder /app/node_modules ./node_modules

# Copy the entire pruned dist (main.js, workspace_modules)
COPY --from=builder /app/apps/quick-chat-api/dist ./

EXPOSE 3000

CMD ["node", "main.js"]


