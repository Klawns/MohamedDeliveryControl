# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20-bookworm-slim
ARG PNPM_VERSION=10.30.3
ARG TURBO_VERSION=2.8.14

FROM node:${NODE_VERSION} AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS pruner
ARG TURBO_VERSION
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo@${TURBO_VERSION} prune api --docker

FROM base AS prod-deps
WORKDIR /app
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
RUN pnpm --filter @mdc/database build
RUN pnpm --filter api build

FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/package.json ./apps/api/package.json
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps /app/packages/database/package.json ./packages/database/package.json
COPY --from=prod-deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/drizzle ./packages/database/drizzle

USER node
EXPOSE 8080

CMD ["node", "apps/api/dist/main.js"]
