# Goods receiving

Goods receiving confirms physical delivery against one receiving-eligible purchase order. A tenant/year counter generates `GR-YYYY-NNNNNN` numbers without `MAX + 1`. Draft receipts are editable only by replacement in this V1 API; posting makes their commercial and traceability facts immutable.

Posting is a synchronous modular-monolith transaction. Receiving validates the PO through `PurchaseOrderAccess`, validates an active `RECEIVING` location through `WarehouseAvailability`, and calls the governed `InventoryPosting` boundary. Inventory validates catalog tracking, writes one immutable `GOODS_RECEIPT` movement and its ledger entries, updates projections without changing reservations, and rejects duplicate serial presence. Procurement then increments line receipt progress under a PO row lock and derives `PARTIALLY_RECEIVED` or `RECEIVED`. Any failure rolls back all effects.

`Idempotency-Key` is mandatory for posting. A key is tenant scoped: an identical retry returns the posted receipt, while reuse for another receipt/version conflicts. Posted receipts are not reversed in V1; corrections use the inventory correction capability or a future returns workflow.

Permissions are `receiving:read` and `receiving:manage`. Every query and foreign key is tenant scoped. Receiving rejects inaccessible POs, mismatched PO lines, cross-warehouse locations, inactive locations, over-receipt, invalid lot/serial dimensions, and stale versions.
