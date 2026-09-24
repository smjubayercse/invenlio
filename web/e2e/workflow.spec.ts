import { expect, test, type Locator, type Page } from "@playwright/test";

const suffix = Date.now().toString(36).toUpperCase();
const productName = `E2E Product ${suffix}`;
const sku = `E2E-SKU-${suffix}`;
const warehouseName = `E2E Warehouse ${suffix}`;
const warehouseCode = `E2E-WH-${suffix}`;
const supplierName = `E2E Supplier ${suffix}`;

async function login(page: Page) {
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!password) throw new Error("E2E_ADMIN_PASSWORD is required");
  await page.goto("/products");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page
    .getByLabel(/username|email/i)
    .fill(process.env.E2E_ADMIN_USER || "admin@invenlio.local");
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText("Tenant 11111111")).toBeVisible();
}

async function openForm(page: Page, button: string, title: string, index = 0) {
  await page
    .getByRole("button", { name: button, exact: true })
    .nth(index)
    .click();
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fill(dialog: Locator, label: string, value: string) {
  await dialog
    .getByRole("textbox", { name: label, exact: true })
    .or(dialog.getByRole("spinbutton", { name: label, exact: true }))
    .fill(value);
}

async function select(
  page: Page,
  dialog: Locator,
  label: string,
  option: string,
) {
  await dialog.getByRole("textbox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function selectMatching(
  page: Page,
  dialog: Locator,
  label: string,
  option: RegExp,
) {
  await dialog.getByRole("textbox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option }).first().click();
}

async function selectFirst(page: Page, dialog: Locator, label: string) {
  await dialog.getByRole("textbox", { name: label, exact: true }).click();
  await page.getByRole("option").first().click();
}

async function save(dialog: Locator) {
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
}

async function confirm(page: Page, label: string) {
  await page.getByRole("button", { name: label, exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: label, exact: true }).click();
  await expect(dialog).toBeHidden();
}

test("authenticated V1 warehouse-to-shipment lifecycle", async ({
  page,
  request,
}) => {
  test.setTimeout(600_000);
  const browserErrors: string[] = [];
  const serverErrors: string[] = [];
  const failedResources: string[] = [];
  let authorization = "";
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("request", (item) => {
    if (item.url().includes("/api/v1/"))
      authorization = item.headers()["authorization"] || authorization;
  });
  page.on("response", (response) => {
    if ([500, 502, 503, 504].includes(response.status()))
      serverErrors.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (item) => {
    if (item.url().includes("/api/v1/") || item.url().includes("/assets/"))
      failedResources.push(
        `${item.url()} ${item.failure()?.errorText || "failed"}`,
      );
  });

  await test.step("authenticate and create catalog item", async () => {
    await login(page);
    const dialog = await openForm(page, "Create", "Create product");
    await fill(dialog, "Product name", productName);
    await fill(dialog, "Initial SKU", sku);
    await save(dialog);
    await page.getByRole("link", { name: productName }).click();
    await confirm(page, "Activate");
    await confirm(page, "Activate SKU");
    await expect(page.getByText(sku)).toBeVisible();
  });

  await test.step("create active warehouse topology", async () => {
    await page.getByRole("link", { name: "Warehouses" }).first().click();
    const warehouse = await openForm(page, "Create", "Create warehouse");
    await fill(warehouse, "Code", warehouseCode);
    await fill(warehouse, "Name", warehouseName);
    await save(warehouse);
    await page.getByRole("link", { name: warehouseCode }).click();
    await confirm(page, "Activate");
    await expect(
      page.getByText("ACTIVE", { exact: true }).first(),
    ).toBeVisible();
    for (const [type, locationType] of [
      ["RECEIVING", "RECEIVING"],
      ["STORAGE", "BIN"],
      ["PACKING", "PACKING"],
    ]) {
      const zone = await openForm(page, "Create", "Create zone");
      await fill(zone, "Code", `${type}-${suffix}`);
      await fill(zone, "Name", `${type} ${suffix}`);
      await select(page, zone, "Type", type);
      await save(zone);
      const location = await openForm(page, "Create", "Create location", 1);
      await select(page, location, "Zone", `${type} ${suffix}`);
      await fill(location, "Code", `${type}-LOC-${suffix}`);
      await fill(location, "Scan code", `${type}-SCAN-${suffix}`);
      await select(page, location, "Type", locationType);
      await save(location);
    }
    await expect(page.getByText(`PACKING-LOC-${suffix}`)).toBeVisible();
  });

  await test.step("create supplier and purchasable mapping", async () => {
    await page.getByRole("link", { name: "Suppliers" }).click();
    const supplier = await openForm(page, "Create", "Create supplier");
    await fill(supplier, "Supplier number", `E2E-SUP-${suffix}`);
    await fill(supplier, "Name", supplierName);
    await save(supplier);
    await page.getByRole("link", { name: `E2E-SUP-${suffix}` }).click();
    await confirm(page, "Activate");
    const mapping = await openForm(page, "Create", "Add supplier product", 2);
    await fill(mapping, "Invenlio SKU", sku);
    await fill(mapping, "Supplier SKU", `VENDOR-${suffix}`);
    await fill(mapping, "Unit cost", "10");
    await save(mapping);
    await expect(page.getByText(`VENDOR-${suffix}`)).toBeVisible();
  });

  let salesOrderUrl = "";
  let salesOrderNumber = "";
  let shipmentUrl = "";
  let variantId = "";
  let warehouseId = "";
  await test.step("purchase, receive, and put stock away", async () => {
    await page.getByRole("link", { name: "Purchase orders" }).click();
    const purchase = await openForm(page, "Create", "Create purchase order");
    await select(page, purchase, "Supplier", supplierName);
    await select(page, purchase, "Destination warehouse", warehouseName);
    await save(purchase);
    await expect(page).toHaveURL(/\/purchase-orders\//);
    const purchaseOrderId = page.url().split("/").pop();
    const line = await openForm(page, "Create", "Add PO line");
    await selectMatching(
      page,
      line,
      "Supplier product",
      new RegExp(`VENDOR-${suffix}`),
    );
    await fill(line, "Quantity", "2");
    await save(line);
    await confirm(page, "Submit");
    await confirm(page, "Approve");
    await confirm(page, "Mark sent");
    await page.getByRole("link", { name: "Goods receipts" }).first().click();
    const receipt = await openForm(
      page,
      "Create receipt",
      "Create goods receipt",
    );
    await selectMatching(
      page,
      receipt,
      "Sent purchase order",
      new RegExp(supplierName),
    );
    await selectFirst(page, receipt, "Line to receive");
    await select(
      page,
      receipt,
      "Receiving location",
      `RECEIVING-LOC-${suffix}`,
    );
    await fill(receipt, "Receiving quantity", "2");
    await receipt.getByRole("button", { name: "Create draft receipt" }).click();
    await expect(page).toHaveURL(/\/goods-receipts\//);
    await confirm(page, "Post receipt");
    const putAway = await openForm(page, "Create", "Create put-away task");
    await selectFirst(page, putAway, "Receipt line");
    await select(page, putAway, "Storage location", `STORAGE-LOC-${suffix}`);
    await fill(putAway, "Quantity", "2");
    await save(putAway);
    await confirm(page, "Complete");
    const headers = { Authorization: authorization };
    const purchaseOrder = await request.get(
      `http://localhost:8080/api/v1/purchase-orders/${purchaseOrderId}`,
      { headers },
    );
    expect(purchaseOrder.ok()).toBeTruthy();
    expect(((await purchaseOrder.json()) as { status: string }).status).toBe(
      "RECEIVED",
    );
    const variant = await request.get(
      `http://localhost:8080/api/v1/catalog/lookup?sku=${sku}`,
      { headers },
    );
    expect(variant.ok()).toBeTruthy();
    variantId = ((await variant.json()) as { id: string }).id;
    const warehouses = await request.get(
      `http://localhost:8080/api/v1/warehouses?q=${warehouseCode}`,
      { headers },
    );
    expect(warehouses.ok()).toBeTruthy();
    warehouseId = (
      (await warehouses.json()) as { content: { id: string; code: string }[] }
    ).content.find((item) => item.code === warehouseCode)!.id;
    const availability = await request.get(
      `http://localhost:8080/api/v1/inventory/availability?variantId=${variantId}&warehouseId=${warehouseId}`,
      { headers },
    );
    expect(availability.ok()).toBeTruthy();
    expect(((await availability.json()) as { onHand: number }).onHand).toBe(2);
  });

  await test.step("sell and reserve stock", async () => {
    await page.getByRole("link", { name: "Customers" }).click();
    await expect(
      page.getByRole("heading", { name: "Customers" }),
    ).toBeVisible();
    const customer = await openForm(page, "Create", "Create customer");
    await fill(customer, "Name", `E2E Customer ${suffix}`);
    await fill(customer, "Shipping address", "Local E2E test address");
    await save(customer);
    await page.getByRole("link", { name: `E2E Customer ${suffix}` }).click();
    await confirm(page, "Activate");
    await page.getByRole("link", { name: "Sales orders" }).click();
    const order = await openForm(page, "Create", "Create sales order");
    await select(page, order, "Customer", `E2E Customer ${suffix}`);
    await select(page, order, "Fulfillment warehouse", warehouseName);
    await save(order);
    await expect(page).toHaveURL(/\/sales-orders\//);
    salesOrderUrl = page.url();
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(
      /^SO-\d{4}-\d{6}$/,
    );
    salesOrderNumber =
      (await page.locator(".page-heading").textContent()) || "";
    const salesLine = await openForm(page, "Create", "Add sales line");
    await fill(salesLine, "SKU", sku);
    await fill(salesLine, "Quantity", "2");
    await fill(salesLine, "Unit price", "20");
    await save(salesLine);
    await confirm(page, "Confirm");
    await confirm(page, "Allocate remaining");
    await expect(
      page.getByText("ALLOCATED", { exact: true }).first(),
    ).toBeVisible();
    const availability = await request.get(
      `http://localhost:8080/api/v1/inventory/availability?variantId=${variantId}&warehouseId=${warehouseId}`,
      { headers: { Authorization: authorization } },
    );
    expect(availability.ok()).toBeTruthy();
    expect(await availability.json()).toMatchObject({
      onHand: 2,
      reserved: 2,
      available: 0,
    });
    await expect(page.getByText(sku)).toBeVisible();
  });

  await test.step("pick, pack, and dispatch", async () => {
    await page.getByRole("link", { name: "Picking" }).click();
    const pick = await openForm(page, "Create pick list", "Create pick list");
    await select(page, pick, "Allocated sales order", salesOrderNumber);
    await select(page, pick, "Packing destination", `PACKING-LOC-${suffix}`);
    await pick.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page).toHaveURL(/\/picking\//);
    await confirm(page, "Start");
    await confirm(page, "Complete task");
    const packing = await openForm(page, "Create", "Open packing session");
    await save(packing);
    await expect(page).toHaveURL(/\/packing\//);
    const pkg = await openForm(page, "Create", "Create package");
    await save(pkg);
    const packageNumber =
      (await page.getByRole("heading", { level: 5 }).last().textContent()) ||
      "";
    const item = await openForm(page, "Create", "Add item to package", 1);
    await selectFirst(page, item, "Picked task");
    await fill(item, "Quantity", "2");
    await save(item);
    await confirm(page, "Seal package");
    await confirm(page, "Complete packing");
    await page.getByRole("link", { name: "Shipping" }).click();
    const shipment = await openForm(page, "Create", "Create shipment");
    await selectMatching(
      page,
      shipment,
      "Packed package",
      new RegExp(packageNumber),
    );
    await save(shipment);
    await expect(page).toHaveURL(/\/shipping\//);
    shipmentUrl = page.url();
    await confirm(page, "Dispatch");
    await expect(page.getByText("DISPATCHED")).toBeVisible();
  });

  await test.step("verify final commercial and physical state", async () => {
    await page.goto(salesOrderUrl);
    await expect(page.getByText("COMPLETED").first()).toBeVisible();
    expect(shipmentUrl).toMatch(/\/shipping\//);
    const headers = { Authorization: authorization };
    const read = async <T>(path: string): Promise<T> => {
      const response = await request.get(
        `http://localhost:8080/api/v1${path}`,
        { headers },
      );
      expect(response.ok(), path).toBeTruthy();
      return response.json() as Promise<T>;
    };
    const variant = await read<{ id: string }>(`/catalog/lookup?sku=${sku}`);
    const warehouses = await read<{ content: { id: string; code: string }[] }>(
      `/warehouses?q=${warehouseCode}`,
    );
    const warehouse = warehouses.content.find(
      (item) => item.code === warehouseCode,
    );
    expect(warehouse).toBeDefined();
    const orderId = salesOrderUrl.split("/").pop();
    const shipmentId = shipmentUrl.split("/").pop();
    const order = await read<{
      status: string;
      lines: { shippedQuantity: number }[];
    }>(`/sales-orders/${orderId}`);
    const shipment = await read<{ status: string }>(`/shipments/${shipmentId}`);
    expect(order.status).toBe("COMPLETED");
    expect(order.lines[0].shippedQuantity).toBe(2);
    expect(shipment.status).toBe("DISPATCHED");
    const availability = await read<{
      onHand: number;
      reserved: number;
      available: number;
    }>(
      `/inventory/availability?variantId=${variant.id}&warehouseId=${warehouse!.id}`,
    );
    expect(availability.onHand).toBe(0);
    expect(availability.reserved).toBe(0);
    expect(availability.available).toBe(0);
    const active = await read<unknown[]>(
      `/inventory/reservations?variantId=${variant.id}&status=ACTIVE`,
    );
    expect(active).toEqual([]);
    const mismatches = await read<unknown[]>(
      "/inventory/reservation-reconciliation",
    );
    expect(mismatches).toEqual([]);
    const ledger = await read<{ quantityDelta: number }[]>(
      `/inventory/ledger?variantId=${variant.id}&size=100`,
    );
    expect(ledger.length).toBeGreaterThanOrEqual(4);
    expect(
      ledger.reduce((total, entry) => total + Number(entry.quantityDelta), 0),
    ).toBe(0);
  });

  expect(browserErrors).toEqual([]);
  expect(serverErrors).toEqual([]);
  expect(failedResources).toEqual([]);
  expect(authorization).toMatch(/^Bearer /);
  const me = await request.get("http://localhost:8080/api/v1/me", {
    headers: { Authorization: authorization },
  });
  expect(me.ok()).toBeTruthy();
});
