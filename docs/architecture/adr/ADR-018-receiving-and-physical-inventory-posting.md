# ADR-018: Receiving and physical inventory posting

## Status

Accepted.

## Decision

Receiving owns receipt confirmation and put-away orchestration, Procurement owns purchase-order commercial progress, Warehouse owns location eligibility, and Inventory remains the sole writer of physical stock projections and immutable ledger history.

The modular monolith uses synchronous public module contracts inside one database transaction. `PurchaseOrderAccess` exposes eligibility and guarded receipt progress; `InventoryPosting` exposes receipt and relocation postings; `WarehouseAvailability` exposes active location metadata. Receiving never accesses another module's entities or repositories and never updates inventory balances directly.

## Consequences

Receipt posting is atomic across receipt status, inventory movement, and PO progress. Put-away relocation is atomic across both locations. Module extraction would require replacing the synchronous transaction with a durable process/outbox design; that complexity is intentionally deferred.
