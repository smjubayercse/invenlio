# Picking and packing

Picking starts from an existing Sales allocation. A pick list belongs to one sales order and one warehouse. Its tasks copy the exact Inventory reservation allocations, including source location, lot, serial, quantity and unit. Creating the list never searches for different stock or changes a reservation. A partially allocated order produces tasks only for its allocated portion; the backorder remains visible in Sales.

The worker starts the list and completes each full task. Inventory atomically consumes the reservation allocation, decreases both on-hand and reserved quantity at the source, increases on-hand at the selected active packing location in the same warehouse, and writes one `PICKING_RELOCATION` movement with equal negative and positive ledger entries. The original allocation remains immutable. A unique append-only consumption record identifies the movement and actor. The reservation becomes `CONSUMED` when all of its allocations are consumed. Insufficient source stock aborts the transaction.

Available-to-promise considers active storage locations only: AISLE, RACK, SHELF, BIN, FLOOR and PALLET_POSITION. Stock in PACKING, RECEIVING, SHIPPING, RETURNS, QUARANTINE or DAMAGED locations cannot be allocated to another order. Picking preserves the lot or serial identity. A serialized allocation has quantity one and moves from its source to a single packing location.

Sales keeps commercial allocation status separate from fulfillment status. The latter progresses from NOT_STARTED through PICKING, PICKED, PACKING and PACKED. Lines expose picked and packed quantities as server-managed projections. Once picking starts, normal Sales cancellation is blocked because a return-to-stock workflow is outside V1.

After all tasks complete, one packing session may be opened for the pick list. Packages have local deterministic numbers, optional integer weight and dimensions, and contain items tied to completed pick tasks. A task's total packaged quantity may not exceed its picked quantity. Multiple packages may split a non-serialized task; a serial may appear in only one package. A session is PACKED only when every picked unit is assigned to a completed package.

Packing writes no inventory movement and does not change on-hand or location. Packaged stock remains company-owned at the packing location until Fulfillment dispatches a shipment and Inventory posts the physical deduction. Wave, batch and cluster picking, route optimization, short-pick exceptions, scanner UI and label printing are deferred.

The HTTP endpoints are documented by the generated OpenAPI at `/v3/api-docs`. Picking uses `/api/v1/pick-lists` and packing uses `/api/v1/packing-sessions`. All operations require tenant authentication and the corresponding picking or packing read/manage permission.
