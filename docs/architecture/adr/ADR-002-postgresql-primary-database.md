# ADR-002: PostgreSQL as primary database

**Status:** Accepted — 2026-09-05

## Context
Orders, stock, accounting-related values, and tenant isolation require strong transactions, constraints, indexing, and mature operations.

## Decision
Use supported PostgreSQL as the authoritative relational store. Evolve schema only through Flyway and use Hibernate validation in production.

## Consequences
SQL and PostgreSQL behavior are first-class and integration tests use PostgreSQL. Modules share an instance initially but own tables. Database scaling must be planned and monitored.

## Alternatives considered
MySQL (capable but offers no project advantage); document database (poor fit for relational invariants); database per module (unnecessary operational cost now).

