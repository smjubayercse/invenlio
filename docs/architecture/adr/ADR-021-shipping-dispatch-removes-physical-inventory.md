# ADR-021: Shipping dispatch removes physical inventory

- Status: Accepted
- Date: 2026-09-22

## Decision

Shipping remains in the fulfillment module. A Shipment owns package assignment and the DRAFT, DISPATCHED and CANCELLED lifecycle. It never accepts client-supplied stock dimensions. Fulfillment derives dispatch lines from immutable packed package items and calls the published Inventory boundary within one database transaction.

Inventory removes stock at the packing location using one immutable `SHIPMENT_DISPATCH` movement. It writes negative ledger entries and updates balances atomically, without a fake destination. Sales owns shipped quantities and the final COMPLETED order transition. Tenant/year counters generate public shipment numbers; database uniqueness prevents double assignment. PostgreSQL advisory locks and a durable idempotency record serialize dispatch retries.

## Consequences

Physical stock leaves the company only at dispatch, not at allocation, picking or packing. Failures roll back inventory, Shipment and Sales progress together. A later service extraction would require a durable saga/outbox and compensating business design; V1 deliberately keeps the synchronous monolith transaction. Carrier integrations, labels, returns and reversal are deferred.
