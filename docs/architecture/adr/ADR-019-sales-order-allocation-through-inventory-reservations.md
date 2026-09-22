# ADR-019: Sales-order allocation through Inventory reservations

**Status:** Accepted — 2026-09-22

## Context

Outbound orders need deterministic allocation, partial fulfillment and concurrency safety without inventing a second stock-hold model or confusing a commercial claim with physical movement.

## Decision

Sales owns Customer, Sales Order, line snapshots and the commercial allocation link. It consumes a published Inventory reservation boundary. Inventory remains authoritative for ATP, FEFO/serial candidates, dimension locking, reservation lifecycle and the reserved balance projection. Each SalesAllocation references a no-expiry `SALES_ORDER_LINE` reservation. Backorder is derived, reallocation is explicit, and cancellation releases all linked active reservations atomically. Allocation never writes the immutable physical ledger.

## Consequences

Competing orders share Inventory's PostgreSQL locks and cannot reserve beyond on-hand. Sales can explain why stock is held without duplicating location, lot or serial truth. Picking in TASK-012 can consume these allocations. Reservation expiry, multi-warehouse order splitting, pricing, tax, invoicing, shipping and background allocation remain deferred.

## Alternatives rejected

A Sales-owned reservation table would create dual authority. Negative ledger movements would misrepresent physical stock. Automatic background allocation adds retry and scheduling complexity before it is needed. One order split across warehouses is deferred to preserve a clear V1 fulfillment contract.
