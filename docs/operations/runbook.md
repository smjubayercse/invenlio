# Invenlio V1 operations runbook

`docker/compose.yml` is a local/demo stack, not an Internet-facing production manifest. It runs PostgreSQL, development-mode Keycloak, the Java backend, and static Nginx frontend. Redis/Kafka are optional architecture services; synchronous V1 business workflows do not require them. Production needs TLS, external secrets, managed persistence, network policy, monitoring, and a hardened Keycloak deployment.

## Start

Install Docker Compose v2, Java 21, Node.js 22.12+, and pnpm 11.19. Copy `.env.example` to `.env`, replace local-only password placeholders, and keep `.env` untracked. From the repository root:

```powershell
docker compose -f docker/compose.yml --env-file .env --profile web build
docker compose -f docker/compose.yml --env-file .env --profile web up -d
docker compose -f docker/compose.yml --env-file .env --profile web ps
```

Set `DEMO_KEYCLOAK_ADMIN_PASSWORD` to the local Keycloak admin value and choose local-only `DEMO_ADMIN_PASSWORD` and `DEMO_READONLY_PASSWORD`; run `./scripts/bootstrap-demo.ps1` after the backend reports ready. Bootstrap creates tenant membership and real Keycloak users, and is idempotent. Never point it at production.

Port 8081 is Keycloak's default. If occupied, change `KEYCLOAK_HTTP_PORT`, `VITE_OIDC_URL`, `OIDC_ISSUER_URI`, and `OIDC_JWK_SET_URI` together before building. The issuer is the browser-visible URL; the backend JWK URL may use `host.docker.internal` on Docker Desktop. The web client is on port 3000 and backend on 8080.

## Health, logs, and migrations

- Check `/actuator/health`, `/actuator/health/liveness`, and `/actuator/health/readiness` on backend port 8080. Redis is optional in V1 and is intentionally excluded from aggregate health. Prometheus metrics at `/actuator/prometheus` require authentication and should remain network-restricted. The web root and a deep link such as `/sales-orders` should return the SPA. Keycloak and PostgreSQL must be healthy in `docker compose ps`.
- Use `docker compose -f docker/compose.yml --profile web logs --tail=100 backend keycloak postgres web` for diagnosis. Do not paste secrets or unnecessary business data into public tickets.
- Flyway applies forward-only V1–V13 migrations on startup. Hibernate validates the schema, never creates production tables. Inspect `flyway_schema_history` when diagnosing a version mismatch.
- API responses include `X-Correlation-ID`, which appears in backend logs. Never log bearer tokens, passwords, or Authorization headers.

## Stop, restart, and persistence

`docker compose -f docker/compose.yml --profile web stop` preserves volumes. `start` or `up -d` resumes. Restart one service with `docker compose -f docker/compose.yml --profile web restart backend` (or `web`) and wait for health. Verify a known record after restart. **Do not use `down -v`** if data must be retained.

## Backup and restore

Use a protected destination; backups contain sensitive business data. Helpers never overwrite an existing file/database:

```powershell
./scripts/backup-postgres.ps1 -OutputPath C:\backups\invenlio-2026-09-23.dump
./scripts/restore-postgres.ps1 -InputPath C:\backups\invenlio-2026-09-23.dump -TargetDatabase invenlio_restore_check
```

Verify restored `flyway_schema_history`, organizations, orders, inventory movements, and shipment counts with `psql`; start an isolated backend against the restored database with Hibernate validation. A dump alone is not proof of recoverability. Encrypt and retain backups according to the operator's policy. Keycloak backup is separate.

## Common failures

- Port conflict: change the Invenlio port setting, not an unrelated service.
- Login loop: compare issuer, JWK URL, redirect URI, token audience and tenant claim. Ensure the local identity and membership exist.
- 403 after login: check local membership and permission; do not bypass backend authorization.
- Backend unhealthy: inspect PostgreSQL connectivity, Flyway, Keycloak JWK access, and readiness logs before changing data.
- 409 stale write: refresh and retry with the current version.
- Restore failure: preserve the isolated failed target for diagnosis, then retry into a new empty database; never overwrite live data.
