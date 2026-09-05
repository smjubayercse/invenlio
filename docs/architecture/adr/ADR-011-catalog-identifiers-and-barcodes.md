# ADR-011: Catalog identifiers and barcode uniqueness

**Status:** Accepted — 2026-09-05

## Context
Warehouse scanning must resolve a code to at most one historical commercial item within an organization.

## Decision
Normalize SKUs and barcode values on write and enforce tenant-scoped uniqueness for all history, including inactive and archived records. Numeric GTIN-8/12/13/14 values require GS1 Mod-10 validation. A partial PostgreSQL unique index allows at most one active primary barcode per variant. Tenant A may reuse Tenant B's identifiers.

## Consequences
Lookup is deterministic and cannot leak cross-tenant matches. Historical codes cannot silently point to a different variant. Full GS1 Application Identifier parsing is deferred.
