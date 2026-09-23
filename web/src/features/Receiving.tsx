import {
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import type {
  PurchaseOrder,
  Receipt,
  PutAway,
  Location,
  Variant,
} from "../api/types";
import type { Page } from "../api/client";
import { post } from "../api/client";
import {
  positiveQuantity,
  requiresLot,
  requiresSerial,
  units,
} from "./workflow";
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

export function Receiving() {
  const { id } = useParams();
  const auth = useAuth();
  const receipt = useResource<Receipt>(`/goods-receipts/${id}`, !!id);
  const locations = useResource<Page<Location>>(
    `/warehouses/${receipt.data?.warehouseId}/locations?size=100`,
    !!receipt.data?.warehouseId,
  );
  const tasks = useResource<PutAway[]>(`/put-away-tasks?receiptId=${id}`, !!id);
  if (!id)
    return (
      <>
        <ResourceList<Receipt>
          title="Goods receipts"
          description="Receive against sent purchase orders, then move goods into storage."
          path="/goods-receipts"
          headers={["Receipt", "PO", "Status", "Received"]}
          row={(r) => [
            <RecordLink to={`/goods-receipts/${r.id}`}>
              {r.receiptNumber}
            </RecordLink>,
            r.purchaseOrderId,
            <Status value={r.status} />,
            r.createdAt ? new Date(r.createdAt).toLocaleString() : "—",
          ]}
          filters={{
            label: "Status",
            values: ["DRAFT", "POSTED", "CANCELLED"],
          }}
          search={false}
          action={auth.can("receiving:manage") && <ReceiptCreate />}
        />
        <PutAwayQueue />
      </>
    );
  return (
    <>
      <PageTitle
        title={receipt.data?.receiptNumber || "Receipt"}
        action={<RecordLink to="/goods-receipts">Back to receipts</RecordLink>}
      />
      <State loading={receipt.isLoading} error={receipt.error}>
        {receipt.data && (
          <Stack>
            <Paper withBorder p="lg">
              <Group justify="space-between">
                <Text>Purchase order {receipt.data.purchaseOrderId}</Text>
                <Status value={receipt.data.status} />
              </Group>
              <Group mt="md">
                {auth.can("receiving:manage") &&
                  receipt.data.status === "DRAFT" && (
                    <ConfirmAction
                      label="Post receipt"
                      title="Post goods receipt"
                      warning="Posting adds physical inventory to the receiving location. Continue?"
                      path={`/goods-receipts/${id}/post`}
                      version={receipt.data.version}
                      idempotent
                    />
                  )}
              </Group>
            </Paper>
            <Title order={4}>Received lines</Title>
            <DataTable
              headers={[
                "Variant",
                "Quantity",
                "Receiving location",
                "Lot",
                "Serial",
              ]}
              rows={receipt.data.lines.map((l) => [
                l.variantId,
                l.receivedBaseQuantity,
                l.receivingLocationId,
                l.lotId || "—",
                l.serialId || "—",
              ])}
            />
            <Group justify="space-between">
              <Title order={4}>Put-away tasks</Title>
              {auth.can("put-away:manage") &&
                receipt.data.status === "POSTED" && (
                  <FormDialog
                    title="Create put-away task"
                    path="/put-away-tasks"
                    fields={[
                      {
                        key: "receiptLineId",
                        label: "Receipt line",
                        required: true,
                        type: "select",
                        options: receipt.data.lines.map((l) => ({
                          value: l.id,
                          label: `${l.variantId} · ${l.receivedBaseQuantity}`,
                        })),
                      },
                      {
                        key: "destinationLocationId",
                        label: "Storage location",
                        required: true,
                        type: "select",
                        options: (locations.data?.content || [])
                          .filter(
                            (l) =>
                              [
                                "AISLE",
                                "RACK",
                                "SHELF",
                                "BIN",
                                "FLOOR",
                                "PALLET_POSITION",
                              ].includes(l.type) && l.status === "ACTIVE",
                          )
                          .map((l) => ({
                            value: l.id,
                            label: l.name || l.code,
                          })),
                      },
                      {
                        key: "quantity",
                        label: "Quantity",
                        required: true,
                        type: "number",
                      },
                    ]}
                  />
                )}
            </Group>
            <State
              loading={tasks.isLoading}
              error={tasks.error}
              empty={!tasks.data?.length}
            >
              <DataTable
                headers={[
                  "Variant",
                  "Quantity",
                  "Source",
                  "Destination",
                  "Status",
                  "Action",
                ]}
                rows={(tasks.data || []).map((t) => [
                  t.variantId,
                  t.quantity,
                  t.sourceLocationId,
                  t.destinationLocationId,
                  <Status value={t.status} />,
                  auth.can("put-away:manage") && t.status === "PENDING" ? (
                    <ConfirmAction
                      label="Complete"
                      path={`/put-away-tasks/${t.id}/complete`}
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

function ReceiptCreate() {
  const nav = useNavigate();
  const auth = useAuth();
  const [opened, setOpened] = useState(false);
  const [poId, setPoId] = useState<string | null>(null);
  const [lineId, setLineId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [lotId, setLotId] = useState<string | null>(null);
  const [serialIds, setSerialIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const orders = useResource<PurchaseOrder[]>("/purchase-orders?size=100");
  const po = orders.data?.find((o) => o.id === poId);
  const line = po?.lines.find((l) => l.id === lineId);
  const locations = useResource<Page<Location>>(
    `/warehouses/${po?.warehouseId}/locations?type=RECEIVING&status=ACTIVE&size=100`,
    !!po,
  );
  const variant = useResource<Variant>(
    `/variants/${line?.variantId}`,
    !!line?.variantId,
  );
  const lots = useResource<{ id: string; lotNumber: string }[]>(
    `/inventory/lots?variantId=${line?.variantId}&status=ACTIVE&size=100`,
    !!line?.variantId,
  );
  const serials = useResource<{ id: string; serialNumber: string }[]>(
    `/inventory/serials?variantId=${line?.variantId}${lotId ? `&lotId=${lotId}` : ""}&status=ACTIVE&size=100`,
    !!line?.variantId,
  );
  async function create() {
    if (!po || !line || !locationId) {
      setError("Choose a purchase order, line and receiving location.");
      return;
    }
    if (requiresLot(variant.data?.trackingMode) && !lotId) {
      setError("Select or register a lot.");
      return;
    }
    if (requiresSerial(variant.data?.trackingMode) && serialIds.length === 0) {
      setError("Select at least one serial.");
      return;
    }
    if (
      !requiresSerial(variant.data?.trackingMode) &&
      !positiveQuantity(quantity)
    ) {
      setError("Enter a positive receiving quantity.");
      return;
    }
    const receiving = requiresSerial(variant.data?.trackingMode)
      ? BigInt(serialIds.length) * 1_000_000n
      : units(quantity);
    if (
      receiving >
      units(line.baseQuantity) - units(line.receivedBaseQuantity)
    ) {
      setError("Receiving quantity exceeds the unreceived PO quantity.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const lines = requiresSerial(variant.data?.trackingMode)
        ? serialIds.map((serialId) => ({
            purchaseOrderLineId: line.id,
            receivedBaseQuantity: "1",
            receivingLocationId: locationId,
            lotId: lotId || null,
            serialId,
          }))
        : [
            {
              purchaseOrderLineId: line.id,
              receivedBaseQuantity: quantity,
              receivingLocationId: locationId,
              lotId: lotId || null,
              serialId: null,
            },
          ];
      const receipt = await post<Receipt>("/goods-receipts", {
        purchaseOrderId: po.id,
        lines,
      });
      setOpened(false);
      nav(`/goods-receipts/${receipt.id}`);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to create receipt.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button onClick={() => setOpened(true)}>Create receipt</Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Create goods receipt"
        size="lg"
      >
        <Stack>
          <Select
            label="Sent purchase order"
            required
            searchable
            data={(orders.data || [])
              .filter((o) => ["SENT", "PARTIALLY_RECEIVED"].includes(o.status))
              .map((o) => ({
                value: o.id,
                label: `${o.number} · ${o.supplierName}`,
              }))}
            value={poId}
            onChange={(v) => {
              setPoId(v);
              setLineId(null);
              setLocationId(null);
            }}
          />
          <Select
            label="Line to receive"
            required
            searchable
            data={(po?.lines || [])
              .filter(
                (l) => Number(l.baseQuantity) > Number(l.receivedBaseQuantity),
              )
              .map((l) => ({
                value: l.id,
                label: `${l.variantSku} · ordered ${l.baseQuantity}, received ${l.receivedBaseQuantity}`,
              }))}
            value={lineId}
            onChange={setLineId}
          />
          <Select
            label="Receiving location"
            required
            searchable
            data={(locations.data?.content || []).map((l) => ({
              value: l.id,
              label: l.name || l.code,
            }))}
            value={locationId}
            onChange={setLocationId}
          />
          {line && (
            <Text size="sm" c="dimmed">
              Tracking: {variant.data?.trackingMode || "NONE"} · Remaining{" "}
              {Math.max(
                0,
                Number(line.baseQuantity) - Number(line.receivedBaseQuantity),
              )}
            </Text>
          )}
          {requiresLot(variant.data?.trackingMode) && (
            <Group>
              <Select
                label="Registered lot"
                required
                searchable
                data={(lots.data || []).map((l) => ({
                  value: l.id,
                  label: l.lotNumber,
                }))}
                value={lotId}
                onChange={setLotId}
              />
              {auth.can("inventory-traceability:manage") && (
                <FormDialog
                  title="Register lot"
                  button="New lot"
                  path="/inventory/lots"
                  fields={[
                    { key: "lotNumber", label: "Lot number", required: true },
                    {
                      key: "manufacturedOn",
                      label: "Manufactured on",
                      type: "date",
                    },
                    {
                      key: "expiresOn",
                      label: "Expiry date",
                      type: "date",
                      required: variant.data.expirationRequired,
                    },
                  ]}
                  transform={(v) => ({ ...v, variantId: line?.variantId })}
                />
              )}
            </Group>
          )}
          {requiresSerial(variant.data?.trackingMode) ? (
            <Group>
              <Select
                label="Serial number"
                required
                searchable
                data={(serials.data || [])
                  .filter((s) => !serialIds.includes(s.id))
                  .map((s) => ({ value: s.id, label: s.serialNumber }))}
                onChange={(v) => {
                  if (v) setSerialIds((previous) => [...previous, v]);
                }}
                placeholder="Select one at a time"
              />
              {auth.can("inventory-traceability:manage") && (
                <FormDialog
                  title="Register serial"
                  button="New serial"
                  path="/inventory/serials"
                  fields={[
                    {
                      key: "serialNumber",
                      label: "Serial number",
                      required: true,
                    },
                  ]}
                  transform={(v) => ({
                    ...v,
                    variantId: line?.variantId,
                    lotId: lotId || null,
                  })}
                />
              )}
            </Group>
          ) : (
            <TextInput
              label="Receiving quantity"
              required
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.currentTarget.value)}
            />
          )}
          {serialIds.length > 0 && (
            <Text size="sm">
              {serialIds.length} serial(s) selected.{" "}
              <Button
                size="compact-xs"
                variant="subtle"
                onClick={() => setSerialIds([])}
              >
                Clear
              </Button>
            </Text>
          )}
          {error && (
            <Text role="alert" c="red" size="sm">
              {error}
            </Text>
          )}
          <Group justify="end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button onClick={() => void create()} loading={busy}>
              Create draft receipt
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

function PutAwayQueue() {
  const auth = useAuth();
  const tasks = useResource<PutAway[]>(
    "/put-away-tasks?status=PENDING&size=100",
  );
  return (
    <Stack mt="xl">
      <Title order={4}>Pending put-away</Title>
      <State
        loading={tasks.isLoading}
        error={tasks.error}
        empty={!tasks.data?.length}
      >
        <DataTable
          headers={[
            "Variant",
            "Quantity",
            "Source",
            "Destination",
            "Status",
            "Action",
          ]}
          rows={(tasks.data || []).map((t) => [
            t.variantId,
            t.quantity,
            t.sourceLocationId,
            t.destinationLocationId,
            <Status value={t.status} />,
            auth.can("put-away:manage") ? (
              <ConfirmAction
                label="Complete"
                path={`/put-away-tasks/${t.id}/complete`}
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
  );
}
