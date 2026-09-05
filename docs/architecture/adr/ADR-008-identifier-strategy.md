# ADR-008: Identifier strategy

**Status:** Accepted — 2026-09-05

## Context
Identifiers must be globally unique, safe to expose, usable across tenants and integrations, and friendly to indexed storage. Sequential IDs disclose volume and complicate extraction.

## Decision
Use UUID identifiers in APIs and storage. Prefer RFC 9562 UUIDv7 for newly created durable domain objects when the selected Java/library implementation is mature; otherwise use cryptographically random UUIDv4 behind a domain identifier type. Never expose sequential database IDs. Database-generated internal sequences are allowed only when they remain private implementation details.

## Consequences
Identifiers can be generated before persistence and moved across services. UUIDv7 improves index locality; mixed-version behavior must be tested and IDs remain opaque to clients.

## Alternatives considered
Auto-increment IDs (information leakage and distribution friction); ULID (less native PostgreSQL/Java support); custom snowflake IDs (operational complexity).

