# Invenlio Engineering Constitution

These rules are mandatory for every human and coding agent changing this repository.

## Before changing code

1. Read `docs/architecture/architecture-overview.md` and all ADRs relevant to the change.
2. Identify the owning module and preserve its public boundary.
3. Check the working tree and preserve unrelated work.

## Architecture and implementation rules

- Keep the modular monolith and package by business capability. Do not introduce a service without an approved ADR and demonstrated extraction need.
- Preserve module boundaries. Cross-module repository or entity access is forbidden unless an ADR explicitly permits it. Communicate through published APIs or events.
- Controllers translate protocols only; business logic belongs in application/domain services. Never expose JPA entities through REST APIs.
- Put transaction boundaries in application services or domain services where appropriate. Make business invariants explicit.
- Validate every untrusted input on the server and evaluate authorization for every operation.
- Tenant isolation is a security boundary, not a query convention. Every data path must be evaluated for tenant context, authorization, persistence constraints, tests, and auditability.
- Every schema change requires a forward-only Flyway migration. Production must not use Hibernate schema generation.
- Public identifiers must follow ADR-008. Do not expose sequential database identifiers.
- Money uses `BigDecimal` and an explicit ISO 4217 currency. Floating-point money is forbidden.
- Store and process time in UTC; expose ISO-8601 timestamps with offsets.
- Do not commit production secrets, credentials, tokens, private keys, or personal data. Development credentials must be clearly labelled and externally configurable.
- Do not invent external integrations or claim a fake/stub implementation is production-ready. A TODO is not a completed feature.
- Do not disable, weaken, or delete tests to make a build pass. Add regression tests for bug fixes and tests for business rules.
- Do not broadly swallow exceptions. Map expected failures explicitly and preserve unexpected failures for observability without leaking secrets.
- Backward compatibility matters for APIs, events, and persisted data. Breaking changes require an explicit migration/versioning plan.
- Logging must never contain passwords, tokens, secrets, unnecessary PII, or sensitive tenant data.
- Keep API documentation, architecture documentation, and ADRs synchronized with architecture-affecting changes.
- Prefer the smallest abstraction that meets a current requirement. New dependencies require a concrete, documented use.

## Definition of Done

A feature is not complete until all applicable items are satisfied:

- implementation and explicit invariants are complete;
- Flyway migrations are created and validated where needed;
- server-side validation and error handling are complete;
- authorization and tenant isolation have been evaluated and tested;
- meaningful unit and integration tests are added;
- Spring Modulith and architecture boundary checks pass;
- logging is useful and safe;
- API/OpenAPI documentation is updated;
- architecture documents or ADRs are updated when relevant;
- `./mvnw verify` passes on Java 21;
- no known critical/high security issue is introduced; and
- no fake stub is represented as finished functionality.

