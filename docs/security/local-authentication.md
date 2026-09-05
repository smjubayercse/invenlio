# Local authentication

1. Copy `.env.example` to `.env`; run `docker compose -f docker/compose.yml --env-file .env up -d`.
2. Keycloak imports `docker/keycloak/invenlio-realm.json`; its console is `http://localhost:8081` and admin credentials come from `.env`.
3. Apply `scripts/local-bootstrap.sql` to the migrated `invenlio` database using `psql`.
4. Development user `admin@invenlio.local` has temporary password `change-me-local-only`. `invenlio-web` is a public authorization-code client; direct grants are enabled only for local CLI testing. `invenlio-api` is the required audience.
5. Obtain a token from `/realms/invenlio/protocol/openid-connect/token` using `invenlio-web`, then call APIs with `Authorization: Bearer …`. The mapper emits tenant `11111111-1111-4111-8111-111111111111`.

The API validates issuer, timestamps, JWK signature, nonblank subject, and audience. Switching `tenant_id` selects context only; an active PostgreSQL membership is still required. Never use this realm, sample user, direct grants, or credentials in production.
