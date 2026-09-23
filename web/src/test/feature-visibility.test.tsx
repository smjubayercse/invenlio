import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { Shipping } from "../features/Shipping";
import { Picking } from "../features/Picking";
import { Sales } from "../features/Sales";
import { Purchasing } from "../features/Purchasing";
const state = vi.hoisted(() => ({ permissions: [] as string[] }));
vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    can: (permission: string) => state.permissions.includes(permission),
  }),
}));
vi.mock("../components/Resource", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../components/Resource")>();
  return {
    ...original,
    useResource: (path: string) => {
      if (path === "/shipments/s1")
        return {
          data: {
            id: "s1",
            shipmentNumber: "SHIP-1",
            salesOrderId: "o1",
            warehouseId: "w1",
            packageIds: ["p1"],
            status: "DRAFT",
            version: 0,
          },
          isLoading: false,
          error: null,
        };
      if (path === "/pick-lists/p1")
        return {
          data: {
            id: "p1",
            salesOrderId: "o1",
            salesOrderNumber: "SO-1",
            warehouseId: "w1",
            packingLocationId: "l1",
            status: "IN_PROGRESS",
            version: 0,
            tasks: [
              {
                id: "t1",
                variantId: "v1",
                sourceLocationId: "l2",
                requiredQuantity: "2",
                pickedQuantity: "0",
                status: "PENDING",
                version: 0,
                sequence: 1,
              },
            ],
          },
          isLoading: false,
          error: null,
        };
      if (path === "/sales-orders/o1")
        return {
          data: {
            id: "o1",
            orderNumber: "SO-1",
            customerId: "c1",
            customerName: "Customer",
            warehouseId: "w1",
            warehouseName: "Main",
            status: "CONFIRMED",
            version: 0,
            lines: [
              {
                id: "line",
                sku: "SKU-1",
                orderedQuantity: "10",
                allocatedQuantity: "4",
                backorderedQuantity: "6",
                pickedQuantity: "0",
                packedQuantity: "0",
                shippedQuantity: "0",
                unitPrice: "9",
              },
            ],
          },
          isLoading: false,
          error: null,
        };
      if (path === "/purchase-orders/po1")
        return {
          data: {
            id: "po1",
            number: "PO-1",
            supplierId: "s1",
            supplierName: "Supplier",
            warehouseId: "w1",
            warehouseName: "Main",
            status: "SUBMITTED",
            version: 0,
            lines: [
              {
                id: "line",
                orderedQuantity: "2",
                receivedBaseQuantity: "0",
                unitCost: "4",
                lineSubtotal: "8",
              },
            ],
          },
          isLoading: false,
          error: null,
        };
      return { data: [], isLoading: false, error: null };
    },
  };
});
afterEach(() => {
  cleanup();
  state.permissions = [];
});
function page(path: string, element: React.ReactNode) {
  render(
    <MantineProvider>
      <ModalsProvider>
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route
                path={path.replace(/\/[^/]+$/, "/:id")}
                element={element}
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>,
  );
}
describe("feature action visibility", () => {
  it("hides dispatch from users without shipping:dispatch", () => {
    page("/shipping/s1", <Shipping />);
    expect(
      screen.queryByRole("button", { name: "Dispatch" }),
    ).not.toBeInTheDocument();
  });
  it("shows dispatch only to authorized users", () => {
    state.permissions = ["shipping:dispatch"];
    page("/shipping/s1", <Shipping />);
    expect(
      screen.getByRole("button", { name: "Dispatch" }),
    ).toBeInTheDocument();
  });
  it("shows pick task completion to picking operators", () => {
    state.permissions = ["picking:manage"];
    page("/picking/p1", <Picking />);
    expect(
      screen.getByRole("button", { name: "Complete task" }),
    ).toBeInTheDocument();
  });
  it("renders partial sales allocation and backorder", () => {
    page("/sales-orders/o1", <Sales />);
    expect(screen.getByText("SKU-1")).toBeInTheDocument();
    expect(screen.getByText("Backorder remains")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });
  it("keeps approval hidden without purchase-order:approve", () => {
    page("/purchase-orders/po1", <Purchasing />);
    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
  });
  it("shows approval to authorized approvers", () => {
    state.permissions = ["purchase-order:approve"];
    page("/purchase-orders/po1", <Purchasing />);
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });
});
