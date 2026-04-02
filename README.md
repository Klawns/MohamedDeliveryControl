# ROTTA

Sistema de gerenciamento de corridas para motoristas.

## Desenvolvimento local

O projeto usa PostgreSQL como banco padrao.

1. Suba o banco local:
```bash
docker compose up -d postgres
```

2. Configure o backend a partir de `apps/api/.env.example`.

3. Aplique as migrations:
```bash
corepack pnpm --filter "@mdc/database" db:migrate
```

4. Inicie o workspace:
```bash
corepack pnpm dev
```
