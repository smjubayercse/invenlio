# Put-away

Put-away moves posted receipt stock from its receiving location to an active storage-eligible location in the same tenant and warehouse. Tasks are `PENDING` or `COMPLETED`; multiple tasks can allocate one receipt line to multiple destinations, but their total cannot exceed the received quantity.

Completion uses the Inventory module's governed relocation operation. One immutable `PUT_AWAY` movement owns paired ledger entries: a negative source entry and a positive destination entry. Sorted advisory dimension locks and conditional projection updates prevent concurrent source overdraw. Serial relocation is guarded by a serial lock, so a serial cannot be physically present at source and destination at the same time.

Completion requires a tenant-scoped idempotency key and optimistic version. Permissions are `put-away:read` and `put-away:manage`. V1 deliberately provides no occupancy optimizer, capacity planner, scanner UI, label printing, replenishment, quality workflow, or cross-docking.
