import { expect, test } from "@playwright/test";

test("real Keycloak login and logout protect the browser application", async ({
  page,
}) => {
  const username = process.env.E2E_ADMIN_USER || "admin@invenlio.local";
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!password) throw new Error("E2E_ADMIN_PASSWORD is required");
  await page.goto("/products");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Products" })).toHaveCount(0);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(
    /\/realms\/invenlio\/protocol\/openid-connect\/auth/,
  );
  await page.getByLabel(/username|email/i).fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/localhost:3000\/products/);
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
  await expect(page.getByText("Tenant 11111111")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Products" })).toHaveCount(0);
});

test("read-only tenant member can view but cannot mutate through UI or API", async ({
  page,
  request,
}) => {
  const password = process.env.E2E_READONLY_PASSWORD;
  if (!password) throw new Error("E2E_READONLY_PASSWORD is required");
  let authorization = "";
  page.on("request", (item) => {
    if (item.url().includes("/api/v1/me"))
      authorization = item.headers()["authorization"] || authorization;
  });
  await page.goto("/products");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel(/username|email/i).fill("readonly@invenlio.local");
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Purchase orders" }).click();
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await page.getByRole("link", { name: "Shipping" }).click();
  await expect(page.getByRole("button", { name: "Dispatch" })).toHaveCount(0);
  expect(authorization).toMatch(/^Bearer /);
  const denied = await request.post("http://localhost:8080/api/v1/products", {
    headers: { Authorization: authorization },
    data: {
      name: "Prohibited product",
      baseUnit: "EA",
      initialVariant: {
        sku: `DENIED-${Date.now()}`,
        displayName: "Prohibited product",
        baseUnit: "EA",
        trackingMode: "NONE",
        expirationRequired: false,
        version: 0,
      },
    },
  });
  expect(denied.status()).toBe(403);
});
