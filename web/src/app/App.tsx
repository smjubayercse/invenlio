import {
  AppShell,
  Alert,
  Avatar,
  Burger,
  Button,
  Group,
  NavLink,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBox,
  IconBuildingWarehouse,
  IconChartBar,
  IconClipboardList,
  IconPackage,
  IconReceipt,
  IconTruck,
  IconUsers,
} from "@tabler/icons-react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router";
import { lazy, Suspense } from "react";
import { useAuth } from "../auth/AuthProvider";
const Dashboard = lazy(() =>
  import("../features/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Products = lazy(() =>
  import("../features/Products").then((m) => ({ default: m.Products })),
);
const Warehouses = lazy(() =>
  import("../features/Warehouses").then((m) => ({ default: m.Warehouses })),
);
const Inventory = lazy(() =>
  import("../features/Inventory").then((m) => ({ default: m.Inventory })),
);
const Suppliers = lazy(() =>
  import("../features/Suppliers").then((m) => ({ default: m.Suppliers })),
);
const Purchasing = lazy(() =>
  import("../features/Purchasing").then((m) => ({ default: m.Purchasing })),
);
const Receiving = lazy(() =>
  import("../features/Receiving").then((m) => ({ default: m.Receiving })),
);
const Customers = lazy(() =>
  import("../features/Customers").then((m) => ({ default: m.Customers })),
);
const Sales = lazy(() =>
  import("../features/Sales").then((m) => ({ default: m.Sales })),
);
const Picking = lazy(() =>
  import("../features/Picking").then((m) => ({ default: m.Picking })),
);
const Packing = lazy(() =>
  import("../features/Packing").then((m) => ({ default: m.Packing })),
);
const Shipping = lazy(() =>
  import("../features/Shipping").then((m) => ({ default: m.Shipping })),
);
const sections = [
  {
    label: "Dashboard",
    items: [{ label: "Overview", path: "/", icon: IconChartBar }],
  },
  {
    label: "Catalog",
    items: [{ label: "Products", path: "/products", icon: IconBox }],
  },
  {
    label: "Warehouse",
    items: [
      { label: "Warehouses", path: "/warehouses", icon: IconBuildingWarehouse },
      { label: "Inventory", path: "/inventory", icon: IconPackage },
    ],
  },
  {
    label: "Procurement",
    items: [
      { label: "Suppliers", path: "/suppliers", icon: IconUsers },
      {
        label: "Purchase orders",
        path: "/purchase-orders",
        icon: IconClipboardList,
      },
      { label: "Goods receipts", path: "/goods-receipts", icon: IconReceipt },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Customers", path: "/customers", icon: IconUsers },
      { label: "Sales orders", path: "/sales-orders", icon: IconClipboardList },
    ],
  },
  {
    label: "Fulfillment",
    items: [
      { label: "Picking", path: "/picking", icon: IconPackage },
      { label: "Packing", path: "/packing", icon: IconBox },
      { label: "Shipping", path: "/shipping", icon: IconTruck },
    ],
  },
];
export function App() {
  const auth = useAuth();
  const location = useLocation();
  const [opened, { toggle, close }] = useDisclosure();
  if (auth.loading)
    return (
      <Paper maw={420} mx="auto" mt={120} p="xl">
        Connecting to Invenlio…
      </Paper>
    );
  if (!auth.authenticated || !auth.me)
    return (
      <Paper maw={460} mx="auto" mt={120} p="xl" withBorder radius="lg">
        <Stack>
          <Title order={2}>Invenlio</Title>
          <Text>Sign in to manage your operations.</Text>
          {auth.error && <Alert color="red">{auth.error}</Alert>}
          <Button onClick={auth.login}>Sign in</Button>
        </Stack>
      </Paper>
    );
  return (
    <AppShell
      header={{ height: 68 }}
      navbar={{ width: 248, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="xl"
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Link to="/" className="brand">
              invenlio<span style={{ color: "#6c7ac9" }}>.</span>
            </Link>
          </Group>
          <Group gap="sm">
            <Avatar color="indigo" radius="xl" size="sm">
              {auth.me.subject.slice(0, 1).toUpperCase()}
            </Avatar>
            <div>
              <Text size="sm" fw={600}>
                {auth.me.subject}
              </Text>
              <Text size="xs" c="dimmed">
                Tenant {auth.me.tenantId.slice(0, 8)}
              </Text>
            </div>
            <Button variant="subtle" size="xs" onClick={auth.logout}>
              Sign out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md" style={{ overflowY: "auto" }}>
        <Stack gap="md">
          {sections.map((s) => (
            <div key={s.label}>
              <Text
                size="xs"
                fw={700}
                c="dimmed"
                tt="uppercase"
                px="sm"
                mb="xs"
              >
                {s.label}
              </Text>
              {s.items.map((item) => (
                <NavLink
                  key={item.path}
                  component={Link}
                  to={item.path}
                  label={item.label}
                  leftSection={<item.icon size={18} />}
                  active={
                    location.pathname === item.path ||
                    (item.path !== "/" &&
                      location.pathname.startsWith(item.path + "/"))
                  }
                  onClick={close}
                />
              ))}
            </div>
          ))}
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main maw={1600} mx="auto">
        <Suspense fallback={<Paper p="xl">Loading workspace…</Paper>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products/:id?" element={<Products />} />
            <Route path="/warehouses/:id?" element={<Warehouses />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/suppliers/:id?" element={<Suppliers />} />
            <Route path="/purchase-orders/:id?" element={<Purchasing />} />
            <Route path="/goods-receipts/:id?" element={<Receiving />} />
            <Route path="/customers/:id?" element={<Customers />} />
            <Route path="/sales-orders/:id?" element={<Sales />} />
            <Route path="/picking/:id?" element={<Picking />} />
            <Route path="/packing/:id?" element={<Packing />} />
            <Route path="/shipping/:id?" element={<Shipping />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell.Main>
    </AppShell>
  );
}
