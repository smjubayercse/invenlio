# ADR-007: API versioning and error model

**Status:** Accepted — 2026-09-05

## Context
Public and client APIs require stable evolution and machine-readable errors across modules.

## Decision
Expose JSON REST under `/api/v1/...`. Use RFC 7807 Problem Details, with stable problem types/codes and a validation-errors extension. Follow the detailed conventions in `docs/api/api-conventions.md`.

## Consequences
Breaking contract changes require a new major path or compatibility bridge. Controllers and generated OpenAPI must consistently implement the shared error contract.

## Alternatives considered
Unversioned URLs (insufficient clarity); media-type versioning (less discoverable); GraphQL as primary API (not currently justified).

