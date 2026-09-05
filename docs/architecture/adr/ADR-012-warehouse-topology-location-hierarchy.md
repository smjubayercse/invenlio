# ADR-012: Warehouse topology and location hierarchy

**Status:** Accepted — 2026-09-05

## Context
Inventory needs durable physical coordinates without coupling topology to stock state or forcing every operator into the same number of structural levels.

## Decision
Model tenant-scoped Warehouse → Zone → StorageLocation. Locations use an adjacency-list parent within the same warehouse, protected by composite foreign keys and iterative cycle checks. Codes become immutable after activation and remain reserved after archival. Physical capacity uses grams, cubic millimetres, millimetres and pallet positions. Records archive rather than delete. No product reference or inventory quantity belongs here.

Operational defaults are explicit purpose-to-location assignments, validated for warehouse ownership and compatible location type. Future Inventory will reference catalog variant UUID plus warehouse/location UUID through published module APIs.

## Consequences
Small and large warehouses share one flexible topology. Standard lists stay paginated; the topology projection is flat, ordered and capped at 20,000 nodes. PostgreSQL `ltree`, occupancy, routing and put-away rules remain future measured optimizations.
