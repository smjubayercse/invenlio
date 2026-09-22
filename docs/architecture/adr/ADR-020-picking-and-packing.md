# ADR-020: Picking and packing ownership

- Status: Accepted
- Date: 2026-09-22

## Decision

Picking and packing form a dedicated `fulfillment` application module. It owns pick lists, pick tasks, packing sessions, packages, and package contents. It communicates with Sales and Inventory only through their published Java interfaces.

Inventory remains the authority for stock. Completing a pick task atomically consumes its reservation allocation, decreases reserved and on-hand quantity at the source, increases on-hand quantity at the order's packing location, and records one balanced `PICKING_RELOCATION` movement. Packing is documentary and does not post inventory movement.

Sales remains the authority for the order. It exposes a separate fulfillment lifecycle (`NOT_STARTED`, `PICKING`, `PICKED`, `PACKING`, `PACKED`) and line-level picked and packed quantities. Cancellation is rejected once fulfillment starts.

Only active storage locations (`AISLE`, `RACK`, `SHELF`, `BIN`, `FLOOR`, `PALLET_POSITION`) participate in available-to-promise selection. Operational locations, including `PACKING`, are deliberately excluded.

## Consequences

- Reservation consumption is immutable and unique per allocation.
- A pick list is unique per sales order and a packing session is unique per pick list/order.
- Tenant and warehouse identity are enforced in application queries and composite foreign keys.
- Optimistic versions protect workflow transitions; row/advisory locks serialize task completion and package numbering.
- Shipment creation, carrier labels, rate shopping, and dispatch remain outside this scope.
