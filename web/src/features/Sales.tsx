import { Alert, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useNavigate, useParams } from "react-router";
import type { Customer, SalesOrder, Warehouse, Variant } from "../api/types";
import { get, type Page } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { remainingToAllocate } from "./workflow";
import { ConfirmAction } from "../components/Actions";
import { FormDialog } from "../components/FormDialog";
import { ResourceList, useResource } from "../components/Resource";
import {
  DataTable,
  PageTitle,
  RecordLink,
  State,
  Status,
} from "../components/Ui";
export function Sales() {
  const { id } = useParams();
  const nav = useNavigate();
  const auth = useAuth();
  const order = useResource<SalesOrder>(`/sales-orders/${id}`, !!id);
  const customers = useResource<Customer[]>(
    "/customers?status=ACTIVE&size=100",
  );
  const warehouses = useResource<Page<Warehouse>>(
    "/warehouses?status=ACTIVE&size=100",
  );
  if (!id)
    return (
      <ResourceList<SalesOrder>
        title="Sales orders"
        description="Confirm, allocate and fulfill customer demand."
        path="/sales-orders"
        headers={["Order", "Customer", "Warehouse", "Status", "Fulfillment"]}
        row={(o) => [
          <RecordLink to={`/sales-orders/${o.id}`}>{o.orderNumber}</RecordLink>,
          o.customerName || o.customerId,
          o.warehouseName || o.warehouseId,
          <Status value={o.status} />,
          <Status value={o.fulfillmentStatus} />,
        ]}
        filters={{
          label: "Status",
          values: [
            "DRAFT",
            "CONFIRMED",
            "ALLOCATED",
            "PARTIALLY_ALLOCATED",
            "COMPLETED",
            "CANCELLED",
          ],
        }}
        action={
          auth.can("sales-order:manage") && (
            <FormDialog
              title="Create sales order"
              path="/sales-orders"
              fields={[
                {
                  key: "customerId",
                  label: "Customer",
                  required: true,
                  type: "select",
                  options: (customers.data || []).map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                },
                {
                  key: "warehouseId",
                  label: "Fulfillment warehouse",
                  required: true,
                  type: "select",
                  options: (warehouses.data?.content || []).map((w) => ({
                    value: w.id,
                    label: w.name,
                  })),
                },
                {
                  key: "shippingAddress",
                  label: "Shipping address",
                  type: "textarea",
                },
              ]}
              onSaved={(r) => nav(`/sales-orders/${(r as SalesOrder).id}`)}
            />
          )
        }
      />
    );
  const pending = order.data?.lines.some(
    (l) => remainingToAllocate(l.orderedQuantity, l.allocatedQuantity) !== "0",
  );
  return (
    <>
      <PageTitle
        title={order.data?.orderNumber || "Sales order"}
        action={
          <RecordLink to="/sales-orders">Back to sales orders</RecordLink>
        }
      />
      <State loading={order.isLoading} error={order.error}>
        {order.data && (
          <Stack>
            <Paper withBorder p="lg">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>
                    {order.data.customerName} · {order.data.warehouseName}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Shipping: {order.data.shippingAddress || "Customer default"}
                  </Text>
                </div>
                <Status value={order.data.status} />
              </Group>
              <Group mt="md">
                <Status value={order.data.fulfillmentStatus} />
                <Status value={order.data.shippingStatus} />
              </Group>
              <Group mt="md">
                {auth.can("sales-order:manage") &&
                  order.data.status === "DRAFT" &&
                  order.data.lines.length > 0 && (
                    <ConfirmAction
                      label="Confirm"
                      path={`/sales-orders/${id}/confirm`}
                      version={order.data.version}
                    />
                  )}
                {auth.can("sales-order:allocate") &&
                  order.data.status !== "DRAFT" &&
                  order.data.status !== "CANCELLED" &&
                  order.data.status !== "COMPLETED" &&
                  pending && (
                    <ConfirmAction
                      label={
                        order.data.lines.some(
                          (l) => l.allocatedQuantity !== "0",
                        )
                          ? "Allocate remaining"
                          : "Allocate"
                      }
                      path={`/sales-orders/${id}/allocate`}
                    />
                  )}
                {auth.can("sales-order:manage") &&
                  !["CANCELLED", "COMPLETED"].includes(order.data.status) && (
                    <FormDialog
                      title="Cancel sales order"
                      button="Cancel"
                      path={`/sales-orders/${id}/cancel`}
                      fields={[
                        {
                          key: "reason",
                          label: "Reason",
                          required: true,
                          type: "textarea",
                        },
                      ]}
                      transform={(v) => ({
                        ...v,
                        version: order.data!.version,
                      })}
                    />
                  )}
              </Group>
            </Paper>
            <Group justify="space-between">
              <Title order={4}>Lines and allocation</Title>
              {auth.can("sales-order:manage") &&
                order.data.status === "DRAFT" && (
                  <FormDialog
                    title="Add sales line"
                    path={`/sales-orders/${id}/lines`}
                    fields={[
                      { key: "sku", label: "SKU", required: true },
                      {
                        key: "quantity",
                        label: "Quantity",
                        required: true,
                        type: "number",
                      },
                      {
                        key: "unitPrice",
                        label: "Unit price",
                        required: true,
                        type: "number",
                      },
                    ]}
                    transform={async (v) => {
                      const variant = await get<Variant>(
                        `/catalog/lookup?sku=${encodeURIComponent(v.sku)}`,
                      );
                      return {
                        variantId: variant.id,
                        quantity: v.quantity,
                        unitPrice: v.unitPrice,
                      };
                    }}
                  />
                )}
            </Group>
            {pending && order.data.status !== "DRAFT" && (
              <Alert color="orange" title="Backorder remains">
                Some ordered quantities have not yet been allocated. Review
                availability and use Allocate remaining when stock is
                replenished.
              </Alert>
            )}
            <State empty={!order.data.lines.length}>
              <DataTable
                headers={[
                  "SKU",
                  "On hand",
                  "Reserved",
                  "Available",
                  "Ordered",
                  "Allocated",
                  "Backordered",
                  "Picked",
                  "Packed",
                  "Shipped",
                  "Unit price",
                ]}
                rows={order.data.lines.map((l) => [
                  l.sku,
                  <Availability
                    variantId={l.variantId}
                    warehouseId={order.data!.warehouseId}
                    field="onHand"
                  />,
                  <Availability
                    variantId={l.variantId}
                    warehouseId={order.data!.warehouseId}
                    field="reserved"
                  />,
                  <Availability
                    variantId={l.variantId}
                    warehouseId={order.data!.warehouseId}
                    field="available"
                  />,
                  l.orderedQuantity,
                  l.allocatedQuantity,
                  l.backorderedQuantity ??
                    remainingToAllocate(l.orderedQuantity, l.allocatedQuantity),
                  l.pickedQuantity,
                  l.packedQuantity,
                  l.shippedQuantity,
                  l.unitPrice,
                ])}
              />
            </State>
            <Text size="sm" c="dimmed">
              Fulfillment: Confirmed → Allocated → Picked → Packed → Shipped →
              Completed. Statuses reflect backend state; no timestamps are
              inferred.
            </Text>
            {order.data.status === "COMPLETED" && (
              <Alert color="green" title="Completed">
                All required quantities have been shipped.
              </Alert>
            )}
          </Stack>
        )}
      </State>
    </>
  );
}
function Availability({
  variantId,
  warehouseId,
  field,
}: {
  variantId: string;
  warehouseId: string;
  field: "onHand" | "reserved" | "available";
}) {
  const availability = useResource<{
    onHand: string;
    reserved: string;
    available: string;
  }>(
    `/inventory/availability?variantId=${variantId}&warehouseId=${warehouseId}`,
  );
  if (availability.isLoading) return <span>…</span>;
  if (availability.isError)
    return <span title="Inventory availability permission required">—</span>;
  return <span>{availability.data?.[field] || "0"}</span>;
}
