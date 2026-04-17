# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20-bookworm-slim
ARG PG_MAJOR=18
ARG PNPM_VERSION=10.30.3
ARG TURBO_VERSION=2.8.14

FROM node:${NODE_VERSION} AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS pruner
ARG TURBO_VERSION
ENV TURBO_TELEMETRY_DISABLED=1
RUN npm install --global turbo@${TURBO_VERSION}
WORKDIR /repo
COPY . .
RUN turbo prune api --docker

FROM base AS prod-deps
WORKDIR /app
COPY --from=pruner /repo/out/json/ .
RUN pnpm fetch --frozen-lockfile --prod
RUN pnpm install --frozen-lockfile --prod --offline

FROM base AS builder
WORKDIR /app
COPY --from=pruner /repo/out/json/ .
RUN pnpm fetch --frozen-lockfile
RUN pnpm install --frozen-lockfile --offline
COPY --from=pruner /repo/out/full/ .
RUN pnpm --filter @mdc/database build
RUN pnpm --filter api build

FROM node:${NODE_VERSION} AS runner
ARG PG_MAJOR
ENV NODE_ENV=production
ENV PORT=8080
ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl gnupg rclone \
  && install -m 0755 -d /etc/apt/keyrings \
  && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  | gpg --dearmor --yes -o /etc/apt/keyrings/postgresql.gpg \
  && chmod a+r /etc/apt/keyrings/postgresql.gpg \
  && . /etc/os-release \
  && echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends "postgresql-client-${PG_MAJOR}" \
  && apt-get purge -y --auto-remove curl gnupg \
  && rm -rf /var/lib/apt/lists/*

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/package.json ./apps/api/package.json
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps /app/packages/database/package.json ./packages/database/package.json
COPY --from=prod-deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/scripts/start-api.sh ./apps/api/scripts/start-api.sh
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/drizzle ./packages/database/drizzle

RUN pg_dump --version
RUN rclone version
RUN chmod +x ./apps/api/scripts/start-api.sh

USER node
EXPOSE 8080

CMD ["/bin/sh", "./apps/api/scripts/start-api.sh"]
