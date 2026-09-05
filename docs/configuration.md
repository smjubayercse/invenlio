# Configuration

Profiles are `local`, `test`, and `production`. Local defaults are explicitly non-production. Tests provision PostgreSQL via Testcontainers. Production configuration has no credential defaults and startup fails when required environment placeholders are absent.

| Variable | Production | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | required | PostgreSQL JDBC URL |
| `DATABASE_USERNAME` | required | Least-privilege database principal |
| `DATABASE_PASSWORD` | required secret | Database credential |
| `REDIS_URL` | required | TLS Redis connection URL |
| `KAFKA_BOOTSTRAP_SERVERS` | required | Kafka bootstrap endpoints |
| `OIDC_ISSUER_URI` | required | Trusted OIDC issuer |

Local Compose additionally reads the `POSTGRES_*` and `KEYCLOAK_*` values shown in `.env.example`. Never reuse those credentials or commit `.env`.

