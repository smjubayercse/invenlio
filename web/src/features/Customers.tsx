import { Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useParams } from "react-router";
import type { Customer } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { ConfirmAction } from "../components/Actions";
import { FormDialog } from "../components/FormDialog";
import { ResourceList, useResource } from "../components/Resource";
import { PageTitle, RecordLink, State, Status } from "../components/Ui";
export function Customers() {
  const { id } = useParams();
  const auth = useAuth();
  const customer = useResource<Customer>(`/customers/${id}`, !!id);
  if (!id)
    return (
      <ResourceList<Customer>
        title="Customers"
        path="/customers"
        headers={["Customer", "Email", "Currency", "Status"]}
        row={(c) => [
          <RecordLink to={`/customers/${c.id}`}>{c.name}</RecordLink>,
          c.email || "—",
          c.defaultCurrency,
          <Status value={c.status} />,
        ]}
        filters={{
          label: "Status",
          values: ["DRAFT", "ACTIVE", "INACTIVE", "BLOCKED", "ARCHIVED"],
        }}
        action={
          auth.can("customer:manage") && (
            <FormDialog
              title="Create customer"
              path="/customers"
              fields={[
                { key: "name", label: "Name", required: true },
                { key: "email", label: "Email" },
                { key: "phone", label: "Phone" },
                {
                  key: "currency",
                  label: "Currency",
                  required: true,
                  defaultValue: "USD",
                },
                {
                  key: "shippingAddress",
                  label: "Shipping address",
                  required: true,
                  type: "textarea",
                },
                {
                  key: "billingAddress",
                  label: "Billing address",
                  type: "textarea",
                },
              ]}
              transform={(values) => ({ ...values, version: 0 })}
            />
          )
        }
      />
    );
  return (
    <>
      <PageTitle
        title={customer.data?.name || "Customer"}
        action={<RecordLink to="/customers">Back to customers</RecordLink>}
      />
      <State loading={customer.isLoading} error={customer.error}>
        {customer.data && (
          <Stack>
            <Paper withBorder p="lg">
              <Group justify="space-between">
                <div>
                  <Title order={4}>{customer.data.name}</Title>
                  <Text c="dimmed">
                    {customer.data.email || "No email"} ·{" "}
                    {customer.data.defaultCurrency}
                  </Text>
                </div>
                <Status value={customer.data.status} />
              </Group>
              <Text mt="md" size="sm">
                Shipping: {customer.data.shippingAddress}
              </Text>
              <Text size="sm">
                Billing: {customer.data.billingAddress || "—"}
              </Text>
              <Group mt="md">
                {auth.can("customer:manage") && (
                  <FormDialog
                    title="Edit customer"
                    button="Edit"
                    method="PATCH"
                    path={`/customers/${id}`}
                    fields={[
                      {
                        key: "name",
                        label: "Name",
                        required: true,
                        defaultValue: customer.data.name,
                      },
                      {
                        key: "email",
                        label: "Email",
                        defaultValue: customer.data.email,
                      },
                      {
                        key: "currency",
                        label: "Currency",
                        required: true,
                        defaultValue: customer.data.defaultCurrency,
                      },
                      {
                        key: "shippingAddress",
                        label: "Shipping address",
                        required: true,
                        type: "textarea",
                        defaultValue: customer.data.shippingAddress,
                      },
                      {
                        key: "billingAddress",
                        label: "Billing address",
                        type: "textarea",
                        defaultValue: customer.data.billingAddress,
                      },
                    ]}
                    transform={(v) => ({
                      ...v,
                      version: customer.data!.version,
                    })}
                  />
                )}
                {auth.can("customer:manage") &&
                  customer.data.status === "DRAFT" && (
                    <ConfirmAction
                      label="Activate"
                      path={`/customers/${id}/activate`}
                      version={customer.data.version}
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
