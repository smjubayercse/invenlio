# ADR-016: Supplier and procurement master-data ownership

**Status:** Accepted — 2026-09-09

## Decision

Procurement is an independent Spring Modulith module and owns Supplier, SupplierAddress, SupplierContact, SupplierProduct, commercial defaults, and preferred sourcing. SupplierProduct links to Catalog only through Catalog's public variant contract and tenant-safe database identity. Catalog, Inventory, and Warehouse do not depend on Procurement.

Current supplier commercial terms are mutable master data. Future purchase orders must snapshot supplier identity, address, supplier SKU, purchase unit/conversion, unit cost/currency, MOQ, order multiple, and lead-time inputs at order creation. Procurement exposes an immutable eligibility/value contract rather than repositories or entities.

## Consequences

Preferred sourcing remains outside Catalog and can enforce one active preferred relation per variant. Supplier lifecycle can block future purchasing without destroying historical mappings. PostgreSQL constraints and optimistic versions protect tenant, uniqueness, and concurrency invariants.

## Alternatives rejected

Supplier fields in Catalog or `preferredSupplierId` on ProductVariant would reverse the dependency. A purchase-order-owned directory would duplicate stable master data. A generic Party model is premature and would obscure the concrete supplier rules needed now.
