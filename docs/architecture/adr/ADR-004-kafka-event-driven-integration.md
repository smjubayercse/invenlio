# ADR-004: Kafka and event-driven integration strategy

**Status:** Accepted — 2026-09-05

## Context
Modules need decoupling and future external integrations need durable asynchronous delivery, but not every interaction benefits from a broker.

## Decision
Use transactional in-process domain events between modules. Use Kafka only for durable externalized events and integration workloads after defining ownership, schemas, idempotency, ordering, retry/dead-letter policy, observability, and a transactional outbox.

## Consequences
Core workflows retain local consistency. External consumers can evolve independently, while eventual consistency and event governance become explicit responsibilities.

## Alternatives considered
Kafka for all internal calls (excessive); synchronous coupling only (limits evolution); another broker (no present advantage, revisitable).

