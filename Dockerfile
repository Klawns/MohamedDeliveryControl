# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack so pnpm version is driven by packageManager in package.json
RUN corepack enable

# Copy manifests and lockfile first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/ui/package.json ./packages/ui/package.json

# Install all workspace dependencies (respects workspace:* protocol)
RUN pnpm install --frozen-lockfile

# Copy full source
COPY . .

# Build the @mdc/database package first (api depends on it)
RUN pnpm --filter @mdc/database build

# Build the api app
RUN pnpm --filter api build

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

RUN corepack enable

# Copy manifests and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/ui/package.json ./packages/ui/package.json

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist

EXPOSE 3000

CMD ["pnpm", "--filter", "api", "start:prod"]
