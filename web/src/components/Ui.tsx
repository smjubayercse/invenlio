import {
  Alert,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Pagination,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconInbox } from "@tabler/icons-react";
import { Link } from "react-router";
import type { ReactNode } from "react";
export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Group justify="space-between" align="start" mb="xl">
      <div>
        <Title className="page-heading" order={2}>
          {title}
        </Title>
        {description && (
          <Text c="dimmed" size="sm" mt={4}>
            {description}
          </Text>
        )}
      </div>
      {action}
    </Group>
  );
}
export function State({
  loading,
  error,
  empty,
  children,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  children: ReactNode;
}) {
  if (loading)
    return (
      <Center py={80}>
        <Loader aria-label="Loading" />
      </Center>
    );
  if (error)
    return (
      <Alert color="red" icon={<IconAlertCircle />} title="Could not load data">
        {error instanceof Error ? error.message : "Please try again."}
      </Alert>
    );
  if (empty)
    return (
      <Paper withBorder p="xl">
        <Stack align="center" gap="xs">
          <IconInbox size={30} color="#8992a5" />
          <Text fw={600}>Nothing here yet</Text>
          <Text c="dimmed" size="sm">
            Try another filter or create a new record.
          </Text>
        </Stack>
      </Paper>
    );
  return <>{children}</>;
}
export function Status({ value }: { value?: string }) {
  const color = !value
    ? "gray"
    : [
          "ACTIVE",
          "APPROVED",
          "COMPLETED",
          "POSTED",
          "SHIPPED",
          "DISPATCHED",
        ].includes(value)
      ? "green"
      : ["CANCELLED", "BLOCKED", "ARCHIVED"].includes(value)
        ? "red"
        : ["DRAFT", "PENDING"].includes(value)
          ? "gray"
          : "blue";
  return (
    <Badge variant="light" color={color}>
      {value?.replaceAll("_", " ") || "—"}
    </Badge>
  );
}
export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <Paper withBorder radius="md" style={{ overflowX: "auto" }}>
      <Table
        className="data-table"
        striped
        highlightOnHover
        verticalSpacing="md"
        horizontalSpacing="lg"
      >
        <Table.Thead>
          <Table.Tr>
            {headers.map((h) => (
              <Table.Th key={h}>{h}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, i) => (
            <Table.Tr key={i}>
              {row.map((cell, j) => (
                <Table.Td key={j}>{cell}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
export function PageControls({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return totalPages > 1 ? (
    <Group justify="end" mt="md">
      <Pagination
        value={page + 1}
        total={totalPages}
        onChange={(value) => onChange(value - 1)}
      />
    </Group>
  ) : null;
}
export function RecordLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="entity-link" to={to}>
      {children}
    </Link>
  );
}
export function ActionButton({
  children,
  onClick,
  disabled,
  loading,
  color,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      color={color}
    >
      {children}
    </Button>
  );
}
