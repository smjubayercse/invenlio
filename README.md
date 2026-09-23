# Invenlio

Invenlio is an enterprise order, inventory, and warehouse management platform being built for European SMEs, wholesalers, distributors, retailers, e-commerce businesses, and multi-warehouse operations.

> **Maturity:** V1 backend workflows and a browser operations interface are under active verification. Production deployment hardening remains necessary.

## Architecture

The backend starts as a domain-driven modular monolith using Spring Modulith. Strong module boundaries, internal domain events, and ports/adapters at genuine external seams allow selective extraction later without accepting premature distributed-system complexity. See the [architecture overview](docs/architecture/architecture-overview.md) and [decision records](docs/architecture/adr/README.md).

## Technology baseline

- Java 21, Maven Wrapper, Spring Boot 4.1.1, Spring Modulith 2.1.1
- Spring MVC, Validation, Security/OAuth2 resource server, Data JPA
- PostgreSQL with Flyway; Redis and Kafka connectivity
- OpenAPI via springdoc; Actuator/Micrometer
- JUnit 5, AssertJ, Testcontainers, ArchUnit, Spring Modulith tests

## Repository layout

| Path | Responsibility |
| --- | --- |
| `backend/` | Executable Java backend and its tests |
| `web/` | React/TypeScript V1 operations application; see [web setup](web/README.md) |
| `warehouse-mobile/` | Future warehouse mobile client placeholder |
| `infrastructure/` | Environment and platform assets |
| `docker/` | Local foundational services |
| `kubernetes/`, `helm/`, `terraform/` | Future deployment/IaC boundaries |
| `docs/` | Architecture, API, security, and operational standards |
| `scripts/` | Repeatable developer automation |

## Prerequisites

- JDK 21; Node.js 22.12+ and pnpm 11.19 for the web application
- Docker Engine with Compose v2 (for integration tests and local infrastructure)

## Local setup

1. Copy `.env.example` to `.env`; values are development-only.
2. Start infrastructure: `docker compose -f docker/compose.yml --env-file .env up -d`.
3. Run the backend: `./mvnw -pl backend spring-boot:run -Dspring-boot.run.profiles=local`.
4. Check `http://localhost:8080/actuator/health`.
5. Follow [web/README.md](web/README.md) to run the browser UI on port 3000 with local Keycloak.

On Windows use `mvnw.cmd` instead of `./mvnw`.

## Verification

Run `./mvnw verify`. Integration tests require Docker and use a real PostgreSQL container; Flyway migrations are applied rather than replacing PostgreSQL with an in-memory database.
For the frontend, run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in `web/`.

## Configuration

Configuration is environment-driven. Local defaults are in `application-local.yml`; test configuration is isolated; production requires database, Redis, Kafka, and OIDC environment variables and validates the schema rather than modifying it. Never commit `.env` or real secrets. See [configuration](docs/configuration.md).
