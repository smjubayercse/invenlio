# V1 security overview

This describes implemented controls and deployment responsibilities, not a certification or penetration-test claim.

- Keycloak authenticates users through OIDC authorization code and PKCE. Browser access tokens remain in memory. The backend validates JWT issuer, audience, signature, lifetime, and subject. The local realm is development-only.
- PostgreSQL owns local identity links, active tenant memberships, roles, and permissions. A signed `tenant_id` selects an organization but does not prove membership. Application services enforce operation-specific permissions; hiding UI controls is only UX.
- Tenant-owned reads/writes are tenant-qualified, with composite database constraints where required. Cross-tenant integration tests cover concealed identifiers.
- Inventory movements and ledger entries are immutable. Balance and reserved projections are updated transactionally. Critical posting paths use durable idempotency keys, database locking, and optimistic versions where appropriate.
- Controllers validate untrusted input and bounds. Expected errors return RFC 7807 problem details without SQL or Java stack traces. Public IDs are UUIDs.
- Local Compose credentials are development-only. Production Spring configuration requires external database and OIDC values and validates schema. `.env` is ignored; no production secret belongs in Git or browser build variables.
- The browser uses a same-origin `/api` proxy, so wildcard credentialed CORS is not enabled. Spring Security and Nginx provide frame/content-type/referrer protections. TLS/HSTS and a tested deployment-specific CSP belong at the production HTTPS ingress.
- `X-Correlation-ID` is returned and logged. Logs must exclude passwords, bearer tokens, Authorization headers, and unnecessary customer data. Restrict operational health and metrics endpoints by network policy.

Remaining deployment responsibilities include hardened Keycloak, TLS, secret rotation, encrypted backups, network/rate restrictions, centralized log access, dependency monitoring, and an incident response process. Do not expose the local demo stack publicly.
