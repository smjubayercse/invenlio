# ADR-013: Immutable inventory ledger and balance projection
**Status:** Accepted — 2026-09-05
## Context
Operational reads need current on-hand stock without sacrificing authoritative history or concurrent correctness.
## Decision
PostgreSQL stores immutable movements and ledger entries. A balance table is synchronously projected in the same transaction. Quantities use NUMERIC(19,6), Catalog base UOM, and non-negative on-hand. Tenant idempotency uses canonical SHA-256 fingerprints. PostgreSQL advisory transaction locks serialize idempotency and balance keys, including missing rows. Future multi-key operations lock in deterministic order. Triggers reject history UPDATE/DELETE.
Inventory uses only public Catalog and Warehouse contracts; composite foreign keys provide defense in depth.
## Consequences
Ledger is authoritative and balances are fast. Reconciliation detects drift; future controlled maintenance can rebuild. Mutable-only stock, sum-on-read, Kafka event sourcing and Redis counters were rejected.
