# Database Conventions

- PostgreSQL is authoritative; Flyway is the only schema-change mechanism. Hibernate uses `validate` in production and tests.
- Names are lower `snake_case`; tables are plural only when natural and naming remains consistent within a module.
- Use `TIMESTAMPTZ`, persist instants in UTC, and name lifecycle columns `created_at` and `updated_at` where meaningful.
- Tenant-owned tables require non-null `tenant_id`; foreign keys, unique constraints, and indexes must include tenant scope where isolation demands it.
- Use primary/foreign keys and check/unique constraints to protect invariants; index proven lookup and relationship paths.
- Use optimistic `version` fields on mutable concurrent aggregates where conflicts matter.
- Monetary amounts use appropriately sized exact `NUMERIC`, mapped to `BigDecimal`, plus an explicit three-character ISO 4217 currency code. Never use floating point.
- Migrations are immutable after release, forward-only, small, and safe for rolling deployment. Destructive/backfill changes use expand-migrate-contract.

