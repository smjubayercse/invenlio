import { Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useNavigate, useParams } from "react-router";
import type {
  PurchaseOrder,
  Supplier,
  Warehouse,
  SupplierProduct,
} from "../api/types";
import type { Page } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
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
export function Purchasing() {
  const { id } = useParams();
  const nav = useNavigate();
  const auth = useAuth();
  const order = useResource<PurchaseOrder>(`/purchase-orders/${id}`, !!id);
  const suppliers = useResource<Supplier[]>(
    "/suppliers?status=ACTIVE&size=100",
  );
  const warehouses = useResource<Page<Warehouse>>(
    "/warehouses?status=ACTIVE&size=100",
  );
  const mappings = useResource<SupplierProduct[]>(
    `/supplier-products?supplierId=${order.data?.supplierId}&size=100`,
    !!order.data?.supplierId,
  );
  if (!id)
    return (
      <ResourceList<PurchaseOrder>
        title="Purchase orders"
        description="Create, approve, send and receive supplier orders."
        path="/purchase-orders"
        sortOptions={[
          { value: "createdAt", label: "Newest" },
          { value: "poNumber", label: "PO number" },
          { value: "status", label: "Status" },
          { value: "total", label: "Total" },
        ]}
        headers={["PO", "Supplier", "Warehouse", "Total", "Status"]}
        row={(o) => [
          <RecordLink to={`/purchase-orders/${o.id}`}>{o.number}</RecordLink>,
          o.supplierName || o.supplierId,
          o.warehouseName || o.warehouseId,
          `${o.total || "0"} ${o.currency || ""}`,
          <Status value={o.status} />,
        ]}
        filters={{
          label: "Status",
          values: [
            "DRAFT",
            "SUBMITTED",
            "APPROVED",
            "SENT",
            "PARTIALLY_RECEIVED",
            "RECEIVED",
            "CANCELLED",
          ],
        }}
        action={
          auth.can("purchase-order:create") && (
            <FormDialog
              title="Create purchase order"
              path="/purchase-orders"
              fields={[
                {
                  key: "supplierId",
                  label: "Supplier",
                  required: true,
                  type: "select",
                  options: (suppliers.data || []).map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                },
                {
                  key: "warehouseId",
                  label: "Destination warehouse",
                  required: true,
                  type: "select",
                  options: (warehouses.data?.content || []).map((w) => ({
                    value: w.id,
                    label: w.name,
                  })),
                },
                {
                  key: "expectedDeliveryDate",
                  label: "Expected delivery",
                  type: "date",
                },
              ]}
              onSaved={(r) =>
                nav(`/purchase-orders/${(r as PurchaseOrder).id}`)
              }
            />
          )
        }
      />
    );
  return (
    <>
      <PageTitle
        title={order.data?.number || "Purchase order"}
        action={
          <RecordLink to="/purchase-orders">Back to purchase orders</RecordLink>
        }
      />
      <State loading={order.isLoading} error={order.error}>
        {order.data && (
          <Stack>
            <Paper withBorder p="lg">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>
                    {order.data.supplierName} → {order.data.warehouseName}
                  </Text>
                  <Text c="dimmed" size="sm">
                    Total: {order.data.total || "0"} {order.data.currency}
                  </Text>
                </div>
                <Status value={order.data.status} />
              </Group>
              <Group mt="md">
                {auth.can("purchase-order:update") &&
                  order.data.status === "DRAFT" && (
                    <FormDialog
                      title="Edit purchase order"
                      button="Edit header"
                      method="PATCH"
                      path={`/purchase-orders/${id}`}
                      fields={[
                        {
                          key: "warehouseId",
                          label: "Warehouse",
                          required: true,
                          type: "select",
                          options: (warehouses.data?.content || []).map(
                            (w) => ({ value: w.id, label: w.name }),
                          ),
                          defaultValue: order.data.warehouseId,
                        },
                        {
                          key: "expectedDeliveryDate",
                          label: "Expected delivery",
                          type: "date",
                          defaultValue: order.data.expectedDeliveryDate,
                        },
                        {
                          key: "supplierReference",
                          label: "Supplier reference",
                          defaultValue: order.data.supplierReference,
                        },
                        {
                          key: "internalNote",
                          label: "Internal note",
                          type: "textarea",
                          defaultValue: order.data.internalNote,
                        },
                        {
                          key: "supplierNote",
                          label: "Supplier note",
                          type: "textarea",
                          defaultValue: order.data.supplierNote,
                        },
                      ]}
                      transform={(v) => ({
                        ...v,
                        version: order.data!.version,
                      })}
                    />
                  )}
                {auth.can("purchase-order:update") &&
                  order.data.status === "DRAFT" &&
                  order.data.lines.length > 0 && (
                    <ConfirmAction
                      label="Submit"
                      path={`/purchase-orders/${id}/submit`}
                      version={order.data.version}
                    />
                  )}
                {auth.can("purchase-order:approve") &&
                  order.data.status === "SUBMITTED" && (
                    <ConfirmAction
                      label="Approve"
                      path={`/purchase-orders/${id}/approve`}
                      version={order.data.version}
                    />
                  )}
                {auth.can("purchase-order:update") &&
                  order.data.status === "APPROVED" && (
                    <ConfirmAction
                      label="Mark sent"
                      path={`/purchase-orders/${id}/mark-sent`}
                      version={order.data.version}
                    />
                  )}
                {auth.can("purchase-order:cancel") &&
                  !["CANCELLED", "RECEIVED"].includes(order.data.status) && (
                    <FormDialog
                      title="Cancel purchase order"
                      button="Cancel"
                      path={`/purchase-orders/${id}/cancel`}
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
              <Title order={4}>Lines</Title>
              {auth.can("purchase-order:update") &&
                order.data.status === "DRAFT" && (
                  <FormDialog
                    title="Add PO line"
                    path={`/purchase-orders/${id}/lines`}
                    fields={[
                      {
                        key: "supplierProductId",
                        label: "Supplier product",
                        required: true,
                        type: "select",
                        options: (mappings.data || []).map((m) => ({
                          value: m.id,
                          label: `${m.supplierSku} · ${m.unitCost} ${m.currency}`,
                        })),
                      },
                      {
                        key: "orderedQuantity",
                        label: "Quantity",
                        required: true,
                        type: "number",
                      },
                      {
                        key: "expectedDeliveryDate",
                        label: "Expected delivery",
                        type: "date",
                      },
                    ]}
                  />
                )}
            </Group>
            <State empty={!order.data.lines.length}>
              <DataTable
                headers={[
                  "SKU",
                  "Ordered",
                  "Received",
                  "Unit cost",
                  "Subtotal",
                  "Action",
                ]}
                rows={order.data.lines.map((line) => [
                  line.variantSku || line.supplierSku,
                  line.orderedQuantity,
                  line.receivedBaseQuantity,
                  line.unitCost,
                  line.lineSubtotal,
                  auth.can("purchase-order:update") &&
                  order.data!.status === "DRAFT" ? (
                    <FormDialog
                      title="Edit PO line"
                      button="Edit"
                      method="PATCH"
                      path={`/purchase-orders/${id}/lines/${line.id}`}
                      fields={[
                        {
                          key: "orderedQuantity",
                          label: "Quantity",
                          required: true,
                          type: "number",
                          defaultValue: line.orderedQuantity,
                        },
                        {
                          key: "expectedDeliveryDate",
                          label: "Expected delivery",
                          type: "date",
                          defaultValue: line.expectedDeliveryDate,
                        },
                      ]}
                      transform={(v) => ({ ...v, version: line.version })}
                    />
                  ) : null,
                ])}
              />
            </State>
            <Text size="xs" c="dimmed">
              Lifecycle: Draft → Submitted → Approved → Sent → Received.
              Approval and posting are permission-gated.
            </Text>
          </Stack>
        )}
      </State>
    </>
  );
}
