import { Card, Group, SimpleGrid, Text, Title } from "@mantine/core";
import { Link } from "react-router";
import { useResource } from "../components/Resource";
import type { Page } from "../api/client";
import type {
  Product,
  Supplier,
  PurchaseOrder,
  Receipt,
  SalesOrder,
  PickList,
  PackingSession,
  Shipment,
} from "../api/types";
import { PageTitle } from "../components/Ui";
function Metric<T>({
  label,
  path,
  to,
  count,
}: {
  label: string;
  path: string;
  to: string;
  count: (data: Page<T> | T[]) => number;
}) {
  const result = useResource<Page<T> | T[]>(path);
  return (
    <Card
      component={Link}
      to={to}
      withBorder
      padding="lg"
      radius="md"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Title order={2} mt="xs">
        {result.isLoading
          ? "…"
          : result.isError
            ? "—"
            : result.data
              ? count(result.data)
              : 0}
      </Title>
      {result.isError && (
        <Text c="red" size="xs">
          Unavailable
        </Text>
      )}
    </Card>
  );
}
const total = <T,>(data: Page<T> | T[]) =>
  Array.isArray(data) ? data.length : data.totalElements;
export function Dashboard() {
  return (
    <>
      <PageTitle
        title="Operations overview"
        description="Your current V1 workflow at a glance. Open a queue to work on it."
      />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        <Metric<Product>
          label="Products"
          path="/products?size=1"
          to="/products"
          count={total}
        />
        <Metric<Supplier>
          label="Suppliers"
          path="/suppliers?status=ACTIVE&size=20"
          to="/suppliers"
          count={total}
        />
        <Metric<PurchaseOrder>
          label="Open purchase orders"
          path="/purchase-orders?status=SENT&size=20"
          to="/purchase-orders"
          count={total}
        />
        <Metric<Receipt>
          label="Receipts"
          path="/goods-receipts?size=20"
          to="/goods-receipts"
          count={total}
        />
        <Metric<SalesOrder>
          label="Sales orders"
          path="/sales-orders?size=20"
          to="/sales-orders"
          count={total}
        />
        <Metric<PickList>
          label="Picking work"
          path="/pick-lists?size=20"
          to="/picking"
          count={total}
        />
        <Metric<PackingSession>
          label="Packing work"
          path="/packing-sessions?size=20"
          to="/packing"
          count={total}
        />
        <Metric<Shipment>
          label="Shipments"
          path="/shipments?size=20"
          to="/shipping"
          count={total}
        />
      </SimpleGrid>
      <Group mt="lg">
        <Text c="dimmed" size="xs">
          Queue counts show the first page where the backend does not provide
          aggregate totals.
        </Text>
      </Group>
    </>
  );
}
