# Inventory domain
Inventory answers how much of a Catalog variant physically exists at a Warehouse location. The immutable ledger is authoritative; the balance is a synchronous derived projection.
~~~mermaid
sequenceDiagram
 Client->>Inventory API: adjustment and Idempotency-Key
 Inventory API->>Authorization: inventory:adjust
 Inventory API->>Catalog: eligibility and base UOM
 Inventory API->>Warehouse: active warehouse and usable location
 Inventory API->>PostgreSQL: lock keys; movement, ledger, balance, audit
 Inventory API-->>Client: movement and onHand
~~~
Movements are opening balance or manual adjustment. Quantities are exact NUMERIC(19,6); EA, BX, PK and PF are discrete. Zero, excessive precision and negative resulting on-hand fail atomically.
Canonical SHA-256 fingerprints cover tenant, stock key, normalized delta, reason and note. Identical retries return the original; changed payloads conflict. PostgreSQL transaction advisory locks work across instances and prevent missing-row lost updates. Future multi-key operations sort lock keys.
Queries are tenant scoped, filtered, bounded to 100 and allow-list sorted. Reconciliation compares ledger sum with projection and never silently repairs. Catalog owns variant eligibility/UOM and Warehouse owns usability. Audit records who authorized an adjustment; ledger records what changed.
Lot/batch, serial and expiry traceability extend each ledger/balance stock dimension as documented in ADR-014. Reservations/availability, receiving, put-away, picking and shipping were added after the original ledger foundation; their current V1 rules are documented separately. General warehouse transfers remain deferred. PostgreSQL, not Redis or Kafka, is authoritative.
