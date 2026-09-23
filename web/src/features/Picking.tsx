import {
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { post, type Page } from "../api/client";
import type { PickList, SalesOrder, Location } from "../api/types";
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
export function Picking() {
  const { id } = useParams();
  const nav = useNavigate();
  const auth = useAuth();
  const pick = useResource<PickList>(`/pick-lists/${id}`, !!id);
  if (!id)
    return (
      <ResourceList<PickList>
        title="Picking"
        description="Move allocated stock from source bins to packing."
        path="/pick-lists"
        headers={["Sales order", "Warehouse", "Tasks", "Status"]}
        row={(p) => [
          <RecordLink to={`/picking/${p.id}`}>
            {p.salesOrderNumber || p.salesOrderId}
          </RecordLink>,
          p.warehouseId,
          p.tasks?.length || 0,
          <Status value={p.status} />,
        ]}
        filters={{
          label: "Status",
          values: ["PENDING", "IN_PROGRESS", "COMPLETED"],
        }}
        search={false}
        action={auth.can("picking:manage") && <PickCreate />}
      />
    );
  return (
    <>
      <PageTitle
        title={`Pick list for ${pick.data?.salesOrderNumber || "order"}`}
        action={<RecordLink to="/picking">Back to picking</RecordLink>}
      />
      <State loading={pick.isLoading} error={pick.error}>
        {pick.data && (
          <Stack>
            <Paper withBorder p="lg">
              <Group justify="space-between">
                <div>
                  <Text>Warehouse {pick.data.warehouseId}</Text>
                  <Text size="sm" c="dimmed">
                    Packing destination {pick.data.packingLocationId}
                  </Text>
                </div>
                <Status value={pick.data.status} />
              </Group>
              <Group mt="md">
                {auth.can("picking:manage") &&
                  pick.data.status === "PENDING" && (
                    <ConfirmAction
                      label="Start"
                      path={`/pick-lists/${id}/start`}
                      version={pick.data.version}
                    />
                  )}
                {auth.can("packing:manage") &&
                  pick.data.status === "COMPLETED" && (
                    <FormDialog
                      title="Open packing session"
                      path="/packing-sessions"
                      fields={[]}
                      transform={() => ({ pickListId: id })}
                      onSaved={(r) =>
                        nav(`/packing/${(r as { id: string }).id}`)
                      }
                    />
                  )}
              </Group>
            </Paper>
            <Title order={4}>Ordered tasks</Title>
            <State empty={!pick.data.tasks?.length}>
              <DataTable
                headers={[
                  "Sequence",
                  "Variant",
                  "Source bin",
                  "Lot / serial",
                  "Required",
                  "Picked",
                  "Status",
                  "Action",
                ]}
                rows={[...(pick.data.tasks || [])]
                  .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                  .map((t) => [
                    t.sequence || "—",
                    t.variantId,
                    t.sourceLocationId,
                    [t.lotId, t.serialId].filter(Boolean).join(" / ") || "—",
                    t.requiredQuantity,
                    t.pickedQuantity,
                    <Status value={t.status} />,
                    auth.can("picking:manage") &&
                    t.status !== "COMPLETED" &&
                    pick.data!.status === "IN_PROGRESS" ? (
                      <ConfirmAction
                        label="Complete task"
                        path={`/pick-lists/${id}/tasks/${t.id}/complete`}
                        version={t.version}
                        idempotent
                      />
                    ) : (
                      "—"
                    ),
                  ])}
              />
            </State>
          </Stack>
        )}
      </State>
    </>
  );
}
function PickCreate() {
  const nav = useNavigate();
  const [opened, setOpened] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const orders = useResource<SalesOrder[]>("/sales-orders?size=100");
  const order = orders.data?.find((o) => o.id === orderId);
  const locations = useResource<Page<Location>>(
    `/warehouses/${order?.warehouseId}/locations?type=PACKING&status=ACTIVE&size=100`,
    !!order,
  );
  async function create() {
    if (!orderId || !locationId) {
      setError("Select an allocated order and a packing location.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const pick = await post<PickList>("/pick-lists", {
        salesOrderId: orderId,
        packingLocationId: locationId,
      });
      setOpened(false);
      nav(`/picking/${pick.id}`);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to create pick list.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button onClick={() => setOpened(true)}>Create pick list</Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Create pick list"
      >
        <Stack>
          <Select
            label="Allocated sales order"
            required
            searchable
            data={(orders.data || [])
              .filter(
                (o) =>
                  o.status !== "DRAFT" &&
                  o.lines.some(
                    (l) =>
                      Number(l.allocatedQuantity) > Number(l.pickedQuantity),
                  ),
              )
              .map((o) => ({ value: o.id, label: o.orderNumber }))}
            value={orderId}
            onChange={(v) => {
              setOrderId(v);
              setLocationId(null);
            }}
          />
          <Select
            label="Packing destination"
            required
            searchable
            data={(locations.data?.content || []).map((l) => ({
              value: l.id,
              label: l.name || l.code,
            }))}
            value={locationId}
            onChange={setLocationId}
          />
          {error && (
            <Text c="red" role="alert" size="sm">
              {error}
            </Text>
          )}
          <Group justify="end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={() => void create()}>
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
