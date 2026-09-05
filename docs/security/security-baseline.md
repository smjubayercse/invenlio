# Security Baseline

Keycloak supplies OAuth2/OIDC identity and signed JWTs; the API performs authorization and tenant checks. Production validates issuer, signature, audience, expiry/not-before and required tenant/membership claims. Use least-privilege roles, external secret management, TLS everywhere, MFA at the IdP, dependency/container scanning, and controlled key rotation.

Rate limits should combine edge controls with tenant/principal/operation-aware application limits. Uploads require size/type limits, generated storage names, malware/content scanning, isolated object storage, authorization on retrieval, and no executable serving. Audit events must identify actor, tenant, action, target, outcome, time, and correlation ID without recording secrets. GDPR work includes lawful purpose, minimization, retention, erasure/export, subprocessor controls, regional processing decisions, and incident response. Review against current OWASP ASVS and API Security Top 10 before release.

