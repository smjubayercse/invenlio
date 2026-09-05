# ADR-001: Modular monolith first

**Status:** Accepted — 2026-09-05

## Context
Invenlio has many related transactional domains but no evidence yet that distributed deployment is worth its consistency and operational costs.

## Decision
Build one Spring Boot deployable with bounded Spring Modulith modules, package-by-capability, explicit module APIs, internal events, and ports/adapters at real external seams.

## Consequences
Local transactions and refactoring remain straightforward; teams must rigorously enforce boundaries. Selected modules can be extracted after their contracts and operational drivers mature.

## Alternatives considered
Microservices immediately (rejected as premature); a technically layered monolith (rejected because it obscures domain ownership); multiple deployables in one repository (deferred until justified).

