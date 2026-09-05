# ADR-009: Application authorization and tenant memberships

**Status:** Accepted — 2026-09-05

## Context
Users may belong to several organizations with different rights. Authentication and application authorization have different lifecycle, audit, and consistency requirements.

## Decision
Keycloak authenticates account identities and issues signed tokens. PostgreSQL owns Invenlio organizations, identity links, memberships, roles, permissions, and assignments. A JWT `tenant_id` selects the requested organization but never proves membership. Every tenant operation resolves the `sub`, verifies an active local identity, active organization and active membership, then evaluates database permissions.

## Consequences
Authorization changes take effect independently of token refresh and are transactionally consistent with tenant administration. Every query must remain explicitly tenant-qualified. Keycloak configuration stays small and application permissions are not duplicated in realm roles.

## Alternatives considered
Keycloak-only roles were rejected because multi-organization membership and transactional application authorization become difficult to govern. A hybrid duplicating roles in both systems was rejected because synchronization creates ambiguous authority. PostgreSQL-only authentication was rejected because Invenlio must not store credentials.
