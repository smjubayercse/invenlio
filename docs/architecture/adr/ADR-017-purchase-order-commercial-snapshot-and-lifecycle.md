# ADR-017: Purchase order commercial snapshot and lifecycle

**Status:** Accepted — 2026-09-22

## Decision

Procurement owns PurchaseOrder and its lines. A PO references an active tenant Supplier and destination Warehouse through published module APIs. Server-generated numbers use an atomic tenant/year counter. The implemented lifecycle is DRAFT → SUBMITTED → APPROVED → SENT, with reasoned cancellation from any implemented active state.

Supplier identity, Warehouse identity, SupplierProduct terms, Catalog SKU/display information, conversion, cost, currency, and expected-date inputs are copied into immutable commercial snapshots. Draft lines may be edited or removed; after submission the database and application reject line mutation. Approval has a separate permission. Mark-sent records an administrative transition only.

PO workflow never changes physical Inventory and publishes no Inventory events. Future Receiving consumes Procurement's controlled `PurchaseOrderAccess` contract for APPROVED or SENT orders and owns receipt progress and physical posting orchestration.

## Consequences

Historical orders remain stable when supplier, product, warehouse, or sourcing master data changes. Counter gaps are accepted for concurrency safety. Totals are tax-exclusive until invoice taxation exists. Receiving, PDF documents, supplier communication, amendments, multi-stage approval, FX, and received quantities remain deferred.

## Rejected alternatives

Dynamic SupplierProduct reads would rewrite commercial history. Storing POs in Inventory confuses commercial intent with physical custody. Treating submission as incoming stock creates false balances. Mutable issued lines undermine auditability and future receiving reconciliation.
