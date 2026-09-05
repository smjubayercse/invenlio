# ADR-003: Shared-schema multi-tenancy

**Status:** Accepted — 2026-09-05

## Context
SME SaaS economics favor shared infrastructure, while tenant data separation is a critical security boundary. Some future enterprise customers may require dedicated databases.

## Decision
Use a shared PostgreSQL database/schema with a UUID `tenant_id` discriminator on every tenant-owned row. Derive tenant context from authenticated claims and enforce isolation through authorization, data access, constraints, automated cross-tenant tests, and auditability. Keep database routing adaptable for future dedicated tenants.

## Consequences
Efficient operations and analytics are possible, but every query and uniqueness/index definition must be tenant-aware. Current context scaffolding is not production-complete isolation.

## Alternatives considered
Schema per tenant (migration/connection overhead); database per tenant (costly at SME scale, retained as enterprise option); frontend-only filtering (categorically insecure).

