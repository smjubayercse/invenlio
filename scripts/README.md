# Developer and operations scripts

- `bootstrap-demo.ps1` provisions the local/demo Keycloak administrator and read-only identities and runs the idempotent SQL tenant bootstrap. It requires three local-only password environment variables and must never run against production.
- `verify-v1.ps1` runs backend and frontend checks; `-E2E` additionally runs Playwright against an already healthy local stack.
- `backup-postgres.ps1` creates a PostgreSQL custom-format dump without overwriting an existing file.
- `restore-postgres.ps1` restores a dump into a new, separate database and refuses existing targets.

See the root README and [operations runbook](../docs/operations/runbook.md) for exact prerequisites and safety notes.
