# Real demo captures

These PNGs are Playwright/Chromium screenshots of the running Invenlio web application, not mockups. They use a 1440×900 viewport, the local Keycloak/OIDC login and fictional demonstration records. No passwords, tokens or developer tools are visible.

To regenerate, start the complete local Compose stack, bootstrap local demo users as described in the root README, and confirm that the demo tenant is disposable. From `web/`, install the locked dependencies and Chromium (`pnpm install --frozen-lockfile`, `pnpm exec playwright install chromium`). Set the local-only `E2E_ADMIN_PASSWORD` in your shell; do not save it to a tracked file. Set `INVENLIO_CAPTURE_SCREENSHOTS=1` and run `pnpm exec playwright test e2e/workflow.spec.ts`. The test creates a new synthetic order flow and writes these images to this directory. With the switch unset, the existing verification test creates no portfolio files.

The workflow uses a unique run suffix on codes so it can be repeated without deleting prior data; human-readable names are fictional and stable. Prefer a fresh disposable demo database when regenerating: aggregate dashboard counts and unrelated table rows otherwise reflect earlier test runs. Review each PNG for errors and sensitive data before committing. Do not run this against a production tenant.
