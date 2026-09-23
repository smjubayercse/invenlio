import { Button, Group, Select, Tabs, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { get, query } from "../api/client";
import type {
  Balance,
  Ledger,
  Warehouse,
  Variant,
  Product,
  Location,
} from "../api/types";
import { useResource } from "../components/Resource";
import { DataTable, PageTitle, State } from "../components/Ui";
export function Inventory() {
  const [warehouseId, setWarehouse] = useState<string | null>(null);
  const [locationId, setLocation] = useState<string | null>(null);
  const [sku, setSku] = useState("");
  const [variantId, setVariant] = useState("");
  const [error, setError] = useState("");
  const warehouses = useResource<{ content: Warehouse[] }>(
    "/warehouses?size=100",
  );
  const locations = useResource<{ content: Location[] }>(
    `/warehouses/${warehouseId}/locations?size=100`,
    !!warehouseId,
  );
  const balances = useResource<Balance[]>(
    `/inventory/balances${query({ warehouseId, locationId, variantId: variantId || undefined, size: 20 })}`,
  );
  const ledger = useResource<Ledger[]>(
    `/inventory/ledger${query({ warehouseId, locationId, variantId: variantId || undefined, size: 20 })}`,
  );
  async function applySku() {
    if (!sku.trim()) {
      setVariant("");
      setError("");
      return;
    }
    try {
      const variant = await get<Variant>(
        `/catalog/lookup?sku=${encodeURIComponent(sku.trim())}`,
      );
      setVariant(variant.id);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "SKU not found.");
    }
  }
  return (
    <>
      <PageTitle
        title="Inventory"
        description="Physical on-hand, reservations and available-to-promise are distinct quantities."
      />
      <Group mb="lg" align="end">
        <Select
          label="Warehouse"
          clearable
          searchable
          data={(warehouses.data?.content || []).map((w) => ({
            value: w.id,
            label: w.name,
          }))}
          value={warehouseId}
          onChange={(v) => {
            setWarehouse(v);
            setLocation(null);
          }}
        />
        <Select
          label="Location"
          clearable
          searchable
          disabled={!warehouseId}
          data={(locations.data?.content || []).map((l) => ({
            value: l.id,
            label: l.name || l.code,
          }))}
          value={locationId}
          onChange={setLocation}
        />
        <TextInput
          label="SKU"
          placeholder="Exact SKU"
          value={sku}
          onChange={(e) => setSku(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void applySku();
          }}
        />
        <Button onClick={() => void applySku()}>Apply</Button>
      </Group>
      {error && (
        <Text role="alert" c="red" mb="md">
          {error}
        </Text>
      )}
      <Tabs defaultValue="balances">
        <Tabs.List>
          <Tabs.Tab value="balances">Balances</Tabs.Tab>
          <Tabs.Tab value="ledger">Movement history</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="balances" pt="md">
          <State
            loading={balances.isLoading}
            error={balances.error}
            empty={!balances.data?.length}
          >
            <DataTable
              headers={[
                "SKU / product",
                "Warehouse",
                "Location",
                "Lot",
                "Serial",
                "On hand",
                "Reserved",
                "Available",
              ]}
              rows={(balances.data || []).map((b) => [
                <SkuCell variantId={b.variantId} />,
                <WarehouseCell id={b.warehouseId} />,
                <LocationCell id={b.locationId} />,
                b.lotId ? <LotCell id={b.lotId} /> : "—",
                b.serialId ? <SerialCell id={b.serialId} /> : "—",
                b.onHand,
                b.reserved,
                b.available,
              ])}
            />
          </State>
        </Tabs.Panel>
        <Tabs.Panel value="ledger" pt="md">
          <State
            loading={ledger.isLoading}
            error={ledger.error}
            empty={!ledger.data?.length}
          >
            <DataTable
              headers={["When", "Type", "SKU", "Location", "Quantity"]}
              rows={(ledger.data || []).map((l) => [
                new Date(l.occurredAt).toLocaleString(),
                l.movementType,
                <SkuCell variantId={l.variantId} />,
                <LocationCell id={l.locationId} />,
                l.quantityDelta,
              ])}
            />
          </State>
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
function SkuCell({ variantId }: { variantId: string }) {
  const variant = useResource<Variant>(`/variants/${variantId}`);
  const product = useResource<Product>(
    `/products/${variant.data?.productId}`,
    !!variant.data?.productId,
  );
  return (
    <>
      <Text fw={600} size="sm">
        {variant.data?.sku || variantId}
      </Text>
      <Text c="dimmed" size="xs">
        {product.data?.name || variant.data?.displayName || ""}
      </Text>
    </>
  );
}
function WarehouseCell({ id }: { id: string }) {
  const warehouse = useResource<Warehouse>(`/warehouses/${id}`);
  return <Text size="sm">{warehouse.data?.code || id}</Text>;
}
function LocationCell({ id }: { id: string }) {
  const location = useResource<Location>(`/warehouse-locations/${id}`);
  return <Text size="sm">{location.data?.code || id}</Text>;
}
function LotCell({ id }: { id: string }) {
  const lot = useResource<{ lotNumber: string }>(`/inventory/lots/${id}`);
  return <Text size="sm">{lot.data?.lotNumber || id}</Text>;
}
function SerialCell({ id }: { id: string }) {
  const serial = useResource<{ serialNumber: string }>(
    `/inventory/serials/${id}`,
  );
  return <Text size="sm">{serial.data?.serialNumber || id}</Text>;
}
