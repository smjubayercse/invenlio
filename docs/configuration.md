# Configuration

Profiles are `local`, `test`, and `production`. Local defaults are explicitly non-production. Tests provision PostgreSQL via Testcontainers. Production configuration has no credential defaults and startup fails when required environment placeholders are absent.

| Variable | Production | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | required | PostgreSQL JDBC URL |
| `DATABASE_USERNAME` | required | Least-privilege database principal |
| `DATABASE_PASSWORD` | required secret | Database credential |
| `OIDC_ISSUER_URI` | required | Trusted OIDC issuer |
| `OIDC_JWK_SET_URI` | required | Reachable signing-key endpoint for the trusted issuer |
| `OIDC_AUDIENCE` | required | Expected API audience claim |

`DATABASE_USERNAME` and `DATABASE_PASSWORD` are also required in production. The `production` profile has no development credential fallback and retains `spring.jpa.hibernate.ddl-auto=validate`; Flyway owns schema migration. API documentation is disabled in that profile. Do not pass secrets through `VITE_*` variables: they are embedded into public browser assets.

For the local Compose stack, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD`, `KEYCLOAK_HTTP_PORT`, and `BACKEND_HTTP_PORT` are configurable. Keep `VITE_OIDC_URL` (browser), `OIDC_ISSUER_URI` (JWT issuer) and `OIDC_JWK_SET_URI` (backend network route to keys) consistent with the selected Keycloak port. The browser uses the same-origin `/api/v1` proxy by default, avoiding cross-origin credentials.

Redis and Kafka client libraries remain on the classpath for future integration work, but no V1 workflow depends on either external service. Production does not require Redis or Kafka endpoints. If deployed for future use, configure and monitor them explicitly; do not assume an unconfigured local broker/cache is a production dependency.

Local Compose additionally reads the `POSTGRES_*` and `KEYCLOAK_*` values shown in `.env.example`. Never reuse those credentials or commit `.env`.
