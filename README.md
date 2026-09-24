# Invenlio

Invenlio is an enterprise order, inventory, and warehouse management platform for European SMEs, wholesalers, distributors, retailers, e-commerce businesses, and multi-warehouse operations.

> **Maturity:** V1.0.0 is verified for its documented local/demo stack. The Compose stack is not an Internet-facing production deployment; see the operations and security deployment responsibilities below.

V1 includes multi-tenancy and RBAC; catalog and SKUs; warehouses and locations; an immutable inventory ledger, balances, lots, serials and reservations; supplier management, purchase orders, receiving and put-away; customers, sales orders and allocation; picking, packing and shipping.

## Architecture

The backend starts as a domain-driven modular monolith using Spring Modulith. Strong module boundaries, internal domain events, and ports/adapters at genuine external seams allow selective extraction later without accepting premature distributed-system complexity. See the [architecture overview](docs/architecture/architecture-overview.md) and [decision records](docs/architecture/adr/README.md).

## Technology baseline

- Java 21, Maven Wrapper, Spring Boot 4.1.1, Spring Modulith 2.1.1
- Spring MVC, Validation, Security/OAuth2 resource server, Data JPA
- PostgreSQL with Flyway; Keycloak OIDC; Redis and Kafka are not required by the synchronous V1 workflow
- React 19, TypeScript, Vite and Nginx for the desktop browser interface
- OpenAPI via springdoc; Actuator/Micrometer
- JUnit 5, AssertJ, Testcontainers, ArchUnit, Spring Modulith tests

## Repository layout

| Path | Responsibility |
| --- | --- |
| `backend/` | Executable Java backend and its tests |
| `web/` | React/TypeScript V1 operations application; see [web setup](web/README.md) |
| `warehouse-mobile/` | Future warehouse mobile client placeholder |
| `infrastructure/` | Environment and platform assets |
| `docker/` | Local PostgreSQL, Keycloak, backend and frontend stack |
| `kubernetes/`, `helm/`, `terraform/` | Future deployment/IaC boundaries |
| `docs/` | Architecture, API, security, and operational standards |
| `scripts/` | Repeatable developer automation |

## Prerequisites

- JDK 21; Node.js 22.12+ and pnpm 11.19 for the web application
- Docker Engine with Compose v2 (for integration tests and local infrastructure)

## Local setup

1. Copy `.env.example` to `.env` and replace the two password placeholders with local-only values. Keep `.env` untracked. If port 8081 is occupied, change `KEYCLOAK_HTTP_PORT`, `VITE_OIDC_URL`, `OIDC_ISSUER_URI` and `OIDC_JWK_SET_URI` consistently.
2. Build and start: `docker compose -f docker/compose.yml --env-file .env --profile web build` then `docker compose -f docker/compose.yml --env-file .env --profile web up -d`.
3. Wait for `docker compose -f docker/compose.yml --env-file .env --profile web ps` to show healthy PostgreSQL, Keycloak, and backend. Check `http://localhost:8080/actuator/health/readiness` and open `http://localhost:3000`.
4. Set `DEMO_KEYCLOAK_ADMIN_PASSWORD` to the local admin value from `.env`, plus separate local-only `DEMO_ADMIN_PASSWORD` and `DEMO_READONLY_PASSWORD`. Run `./scripts/bootstrap-demo.ps1`. The script seeds tenant membership and sets the two Keycloak user passwords. It never runs on the production profile.

On Windows use `mvnw.cmd` instead of `./mvnw`.

## Verification

Run `./scripts/verify-v1.ps1` on Windows with Java 21, or `./mvnw verify` and the frontend commands in [web/README.md](web/README.md). Integration tests require Docker and real PostgreSQL; Flyway migrations run from an empty database. Browser E2E requires the live stack and `E2E_ADMIN_PASSWORD` / `E2E_READONLY_PASSWORD`: `./scripts/verify-v1.ps1 -E2E`.

Real screenshots have not been captured for the release. Do not use mock or fabricated screenshots as evidence.

## Configuration

Configuration is environment-driven. Local defaults are in `application-local.yml`; tests are isolated; production requires external database and OIDC configuration and validates rather than generates schema. Redis and Kafka are not required by V1 workflows. Never commit `.env` or real secrets. See [configuration](docs/configuration.md), [operations runbook](docs/operations/runbook.md), [security overview](docs/security/security-overview.md), and [V1 scope](docs/releases/v1.0.0.md). Returns, accounting, carrier integration, mobile scanning and advanced WMS optimization are deferred beyond V1.
