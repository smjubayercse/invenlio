# ADR-010: Product/variant catalog model

**Status:** Accepted — 2026-09-05

## Context
Operational modules need one stable item identifier whether a product is simple or configurable. Mixing stock fields into product master data or representing simple items differently creates incompatible order and inventory paths.

## Decision
Catalog owns descriptive master data. Every Product has one or more ProductVariants; every sellable/stockable item is a variant with a tenant-unique, historically non-reusable normalized SKU. A simple product is atomically created with one `DEFAULT` variant. Configurable variants select relational option values and have a deterministic, database-unique combination signature. SKU changes are permitted only while DRAFT. Catalog contains no inventory quantities or warehouse state.

## Consequences
Future inventory, purchasing, order and fulfillment lines consistently reference variant UUIDs. Archived SKUs remain reserved. Creating a simple product is ergonomic at the API but structurally uniform. Inventory remains a separate immutable-ledger bounded module.

## Alternatives considered
Product-as-SKU (rejected because variants become exceptional); JSON options (rejected because integrity and queryability suffer); inventory columns on variants (rejected because ownership belongs to inventory).
