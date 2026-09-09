# ADR-015: Inventory reservations and availability projection
**Status:** Accepted — 2026-09-09

## Decision
Reservations never alter the immutable physical ledger. Headers and immutable allocations are authoritative; reserved quantity is projected synchronously into the balance. Available equals on-hand minus reserved, while ATP adds operational eligibility. Physical and commercial mutations share PostgreSQL dimension advisory locks. Reservations are ACTIVE, RELEASED or EXPIRED, and a bounded `SKIP LOCKED` worker expires overdue holds. PostgreSQL remains authoritative.

## Consequences
Fast availability reads retain durable reservation history and multi-instance correctness. Projection reconciliation/rebuild remains possible from ACTIVE allocations. Negative physical corrections cannot reduce on-hand below reserved.

## Alternatives rejected
Negative ledger movements confuse claims with physical stock; Redis counters weaken transactional authority; sum-on-read is operationally expensive; a separate service adds distributed consistency prematurely; optimistic locking alone does not safely coordinate missing rows and multiple instances.
