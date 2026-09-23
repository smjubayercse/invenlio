import { Group, Paper, Stack, Text } from "@mantine/core";
import { useNavigate, useParams } from "react-router";
import type { PackingSession, Shipment } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { ConfirmAction } from "../components/Actions";
import { FormDialog } from "../components/FormDialog";
import { ResourceList, useResource } from "../components/Resource";
import { PageTitle, RecordLink, State, Status } from "../components/Ui";
export function Shipping() {
  const { id } = useParams();
  const nav = useNavigate();
  const auth = useAuth();
  const shipment = useResource<Shipment>(`/shipments/${id}`, !!id);
  const sessions = useResource<PackingSession[]>(
    "/packing-sessions?status=PACKED&size=100",
  );
  const options = (sessions.data || []).flatMap((s) =>
    s.packages
      .filter((p) => p.status === "PACKED")
      .map((p) => ({
        value: p.id,
        label: `${p.packageNumber} · order ${s.salesOrderId}`,
      })),
  );
  if (!id)
    return (
      <ResourceList<Shipment>
        title="Shipping"
        description="Prepare and dispatch packed packages."
        path="/shipments"
        headers={["Shipment", "Sales order", "Carrier", "Status", "Dispatched"]}
        row={(s) => [
          <RecordLink to={`/shipping/${s.id}`}>{s.shipmentNumber}</RecordLink>,
          s.salesOrderId,
          s.carrierName || "—",
          <Status value={s.status} />,
          s.dispatchedAt ? new Date(s.dispatchedAt).toLocaleString() : "—",
        ]}
        filters={{
          label: "Status",
          values: ["DRAFT", "DISPATCHED", "CANCELLED"],
        }}
        search={false}
        action={
          auth.can("shipping:manage") && (
            <FormDialog
              title="Create shipment"
              path="/shipments"
              fields={[
                {
                  key: "packageId",
                  label: "Packed package",
                  required: true,
                  type: "select",
                  options,
                },
                { key: "carrierName", label: "Carrier" },
                { key: "serviceName", label: "Service" },
                { key: "trackingNumber", label: "Tracking number" },
              ]}
              transform={(v) => ({
                salesOrderId: sessions.data?.find((s) =>
                  s.packages.some((p) => p.id === v.packageId),
                )?.salesOrderId,
                packageIds: [v.packageId],
                carrierName: v.carrierName || null,
                serviceName: v.serviceName || null,
                trackingNumber: v.trackingNumber || null,
              })}
              onSaved={(r) => nav(`/shipping/${(r as Shipment).id}`)}
            />
          )
        }
      />
    );
  return (
    <>
      <PageTitle
        title={shipment.data?.shipmentNumber || "Shipment"}
        action={<RecordLink to="/shipping">Back to shipping</RecordLink>}
      />
      <State loading={shipment.isLoading} error={shipment.error}>
        {shipment.data && (
          <Stack>
            <Paper withBorder p="lg">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>Sales order {shipment.data.salesOrderId}</Text>
                  <Text size="sm" c="dimmed">
                    {shipment.data.packageIds.length} package(s)
                  </Text>
                </div>
                <Status value={shipment.data.status} />
              </Group>
              <Text mt="md">
                Carrier: {shipment.data.carrierName || "—"} · Service:{" "}
                {shipment.data.serviceName || "—"} · Tracking:{" "}
                {shipment.data.trackingNumber || "—"}
              </Text>
              <Group mt="lg">
                {auth.can("shipping:manage") &&
                  shipment.data.status === "DRAFT" && (
                    <FormDialog
                      title="Edit shipment"
                      button="Edit details"
                      method="PATCH"
                      path={`/shipments/${id}`}
                      fields={[
                        {
                          key: "carrierName",
                          label: "Carrier",
                          defaultValue: shipment.data.carrierName,
                        },
                        {
                          key: "serviceName",
                          label: "Service",
                          defaultValue: shipment.data.serviceName,
                        },
                        {
                          key: "trackingNumber",
                          label: "Tracking number",
                          defaultValue: shipment.data.trackingNumber,
                        },
                      ]}
                      transform={(v) => ({
                        ...v,
                        version: shipment.data!.version,
                      })}
                    />
                  )}
                {auth.can("shipping:dispatch") &&
                  shipment.data.status === "DRAFT" && (
                    <ConfirmAction
                      label="Dispatch"
                      title="Dispatch shipment?"
                      warning="Dispatch removes these items from physical warehouse inventory and cannot be reversed in V1."
                      path={`/shipments/${id}/dispatch`}
                      idempotent
                      color="red"
                    />
                  )}
                {auth.can("shipping:manage") &&
                  shipment.data.status === "DRAFT" && (
                    <ConfirmAction
                      label="Cancel draft"
                      path={`/shipments/${id}/cancel`}
                      version={shipment.data.version}
                      color="gray"
                    />
                  )}
              </Group>
            </Paper>
          </Stack>
        )}
      </State>
    </>
  );
}
