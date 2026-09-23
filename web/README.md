# Invenlio Web (V1)

React 19, TypeScript 5, Vite 7 and Mantine provide the desktop-first operations interface. React Router owns navigation, TanStack Query owns server state, and one typed `src/api/client.ts` handles authorization headers and RFC 7807 errors. OIDC tokens remain in Keycloak JS memory; no password or token is stored in browser storage.

## Prerequisites and run

- Node.js 22.12+ (Node 24 recommended), pnpm 11.19, Java 21, Docker Desktop.
- Start local services from the repository root: `docker compose -f docker/compose.yml up -d`.
- Start the backend with the `local` profile on `http://localhost:8080`.
- In `web/`, copy `.env.example` to `.env.local`, then run `pnpm install --frozen-lockfile` and `pnpm dev`. Open `http://localhost:3000`.
- The local Keycloak realm is at `http://localhost:8081`. The public OIDC client is `invenlio-web`; redirect URI must include `http://localhost:3000/*`. Add an active user and membership in the intended tenant, with `tenant_id` token claim and appropriate backend roles. The local realm import is in `docker/keycloak/invenlio-realm.json`. Never place client secrets in Vite variables.

The Vite dev proxy forwards `/api` to the backend. Override `VITE_API_BASE_URL`, `VITE_OIDC_URL`, `VITE_OIDC_REALM`, and `VITE_OIDC_CLIENT_ID` for other environments. Vite variables are public build-time configuration, never secrets. Backend permission checks remain authoritative; hidden controls only improve UX.

## Verify and build

From `web/`: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. From repository root: `./mvnw verify` on Java 21. The optional Docker image builds with `docker compose -f docker/compose.yml --profile web build web`, then serves at port 3000 when started with the `web` profile. The backend must separately listen on host port 8080 for the image's nginx reverse proxy.

## Deterministic V1 smoke flow

Use a tenant operator with all V1 permissions and a warehouse with active receiving, storage and packing locations. Confirm no browser console errors at each step. When a step displays a problem, do not bypass it; repair the master data or authorization first.

1. Sign in through Keycloak. Confirm the header shows the correct tenant and `GET /api/v1/me` returns effective permissions. Sign out and confirm protected pages disappear.
2. Create and activate a product with a unique SKU. If lot/serial tracked, register the identity in Goods Receipts before posting.
3. Create and activate a supplier. Add a supplier-product mapping using the SKU and unit cost.
4. Create a purchase order for that supplier and an active warehouse. Add the mapped supplier product line and quantity. Submit, approve with an approver, and mark sent.
5. Create a goods receipt from the sent PO. Select its line and an active receiving location, enter quantity or registered serials, and post. Verify receiving inventory appears under Inventory.
6. Create and complete a put-away task to an active storage location. Verify the receiving and storage balances changed as expected.
7. Create and activate a customer. Create a sales order for the customer/warehouse, add the SKU and a price, confirm, and allocate. Compare ordered, allocated, backordered, picked, packed and shipped line figures; use Allocate remaining after any replenishment.
8. Create a pick list with a packing destination, start it and complete every task in order. Confirm the source/storage and packing balances.
9. Open a packing session from the completed pick list, create a package, add picked quantities without exceeding the remaining quantity, seal it, and complete the session.
10. Create a shipment from the completed package, optionally set carrier/service/tracking, read the irreversible dispatch warning and confirm dispatch. Verify shipment DISPATCHED, inventory decremented and sales order COMPLETED if all required quantities shipped.
11. Repeat key reads as a read-only member: creation, approval and dispatch controls must be hidden; direct API authorization must still return 403. An expired session must require fresh sign-in without exposing raw tokens.

Known V1 UX constraints: large master-data selectors show the first 100 records; SKU lookup avoids this limit for supplier mappings and sales lines. A receipt draft captures one PO line at a time; repeat for additional lines. Shipping creation selects one packed package at a time; repeat for multiple shipments. No mobile scanner, returns, invoices, carrier integration or advanced analytics are in scope.
