# ADR-005: Authentication with OAuth2/OIDC and Keycloak

**Status:** Accepted — 2026-09-05

## Context
A multi-tenant commercial product needs standards-based SSO, centralized identity lifecycle, MFA, and signed tokens without implementing credential storage itself.

## Decision
Use Keycloak as the planned OAuth2/OIDC provider and configure the backend as a stateless JWT resource server. Model RBAC plus fine-grained tenant-aware permissions. MFA and primary authentication policy remain at Keycloak.

## Consequences
The API validates issuer, signature, audience, lifetime, and claims; authorization remains an application responsibility. Keycloak configuration, key rotation, availability, and secure administration require operations.

## Alternatives considered
Custom authentication (unacceptable risk); opaque sessions (less suitable for public APIs); managed IdP (possible future substitution through standards).

