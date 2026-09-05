# ADR-014: Inventory traceability dimensions
**Status:** Accepted — 2026-09-05

## Context
Regulated and serialized goods require durable identity, expiry and physical-location traceability without weakening ADR-013.

## Decision
Catalog owns explicit variant tracking policy, editable only in DRAFT. Inventory owns normalized Lot and Serial identities. Nullable lot/serial UUID dimensions extend ledger entries and balances; PostgreSQL `NULLS NOT DISTINCT` gives one logical balance row. Tenant/variant composite foreign keys prevent identifier injection. Serialized deltas are ±1 and a tenant/serial advisory lock protects the global on-hand maximum of one. Expiry is derived from `LocalDate`; it never causes automatic stock mutation. Indexes keep future FEFO reads practical.

## Consequences
Existing V5 history and balances remain untracked and variants default to NONE. Traceable identity stays relational and queryable while ledger history remains immutable. Receiving, allocation, transfer, recall, warranty and GS1 workflows remain deferred.

## Alternatives rejected
Text identifiers on ledger weaken referential integrity; separate ledgers fragment reconciliation; JSON dimensions impair constraints/indexes; mutable possession state on Serial would duplicate and conflict with the authoritative ledger.
