# ADR-006: Immutable inventory ledger as future source of truth

**Status:** Accepted (architecture only; not implemented) — 2026-09-05

## Context
Inventory corrections, reservations, lots/serials, transfers, and audit investigations require explainable stock history. Mutable quantity fields alone lose causality.

## Decision
The future inventory bounded context will record immutable, append-only inventory movements as the source of truth. Current balances will be derived projections optimized for reads and reconciled to the ledger.

## Consequences
Every adjustment remains auditable and replayable. Posting must enforce invariants, idempotency, ordering, unit/lot/location dimensions, and reversal rather than mutation. Projection lag and reconciliation require explicit operations.

## Alternatives considered
Mutable on-hand counters only (insufficient auditability); event sourcing the entire product (unnecessary scope); periodic snapshots without movements (insufficient causality).

