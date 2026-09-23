import { Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useParams } from "react-router";
import type { Supplier, SupplierProduct, Variant } from "../api/types";
import { get } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { FormDialog } from "../components/FormDialog";
import { ResourceList, useResource } from "../components/Resource";
import { ConfirmAction } from "../components/Actions";
import {
  DataTable,
  PageTitle,
  RecordLink,
  State,
  Status,
} from "../components/Ui";
type Address = {
  id: string;
  type: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  countryCode: string;
  status: string;
};
type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email?: string;
  phone?: string;
  active: boolean;
};
export function Suppliers() {
  const { id } = useParams();
  const auth = useAuth();
  const supplier = useResource<Supplier>(`/suppliers/${id}`, !!id);
  const mappings = useResource<SupplierProduct[]>(
    `/supplier-products?supplierId=${id}`,
    !!id,
  );
  const addresses = useResource<Address[]>(`/suppliers/${id}/addresses`, !!id);
  const contacts = useResource<Contact[]>(`/suppliers/${id}/contacts`, !!id);
  if (!id)
    return (
      <ResourceList<Supplier>
        title="Suppliers"
        description="Vendor records and purchasable SKU mappings."
        path="/suppliers"
        headers={["Number", "Supplier", "Currency", "Status"]}
        row={(s) => [
          <RecordLink to={`/suppliers/${s.id}`}>{s.supplierNumber}</RecordLink>,
          s.name,
          s.defaultCurrency,
          <Status value={s.status} />,
        ]}
        filters={{
          label: "Status",
          values: ["DRAFT", "ACTIVE", "INACTIVE", "BLOCKED", "ARCHIVED"],
        }}
        action={
          auth.can("procurement-supplier:manage") && (
            <FormDialog
              title="Create supplier"
              path="/suppliers"
              fields={[
                {
                  key: "supplierNumber",
                  label: "Supplier number",
                  required: true,
                },
                { key: "name", label: "Name", required: true },
                {
                  key: "defaultCurrency",
                  label: "Currency",
                  required: true,
                  defaultValue: "USD",
                },
                { key: "email", label: "Email" },
                { key: "phone", label: "Phone" },
              ]}
            />
          )
        }
      />
    );
  return (
    <>
      <PageTitle
        title={supplier.data?.name || "Supplier"}
        action={<RecordLink to="/suppliers">Back to suppliers</RecordLink>}
      />
      <State loading={supplier.isLoading} error={supplier.error}>
        {supplier.data && (
          <Stack>
            <Paper withBorder p="lg">
              <Group justify="space-between">
                <div>
                  <Title order={4}>{supplier.data.supplierNumber}</Title>
                  <Text c="dimmed">
                    {supplier.data.email || "No email"} ·{" "}
                    {supplier.data.defaultCurrency}
                  </Text>
                </div>
                <Status value={supplier.data.status} />
              </Group>
              <Group mt="md">
                {auth.can("procurement-supplier:manage") && (
                  <FormDialog
                    title="Edit supplier"
                    button="Edit"
                    method="PATCH"
                    path={`/suppliers/${id}`}
                    fields={[
                      {
                        key: "supplierNumber",
                        label: "Supplier number",
                        required: true,
                        defaultValue: supplier.data.supplierNumber,
                      },
                      {
                        key: "name",
                        label: "Name",
                        required: true,
                        defaultValue: supplier.data.name,
                      },
                      {
                        key: "defaultCurrency",
                        label: "Currency",
                        required: true,
                        defaultValue: supplier.data.defaultCurrency,
                      },
                      {
                        key: "email",
                        label: "Email",
                        defaultValue: supplier.data.email,
                      },
                      {
                        key: "phone",
                        label: "Phone",
                        defaultValue: supplier.data.phone,
                      },
                    ]}
                    transform={(v) => ({
                      ...v,
                      version: supplier.data!.version,
                    })}
                  />
                )}
                {auth.can("procurement-supplier:manage") &&
                  supplier.data.status === "DRAFT" && (
                    <ConfirmAction
                      label="Activate"
                      path={`/suppliers/${id}/activate`}
                      version={supplier.data.version}
                    />
                  )}
              </Group>
            </Paper>
            <Group justify="space-between">
              <Title order={4}>Addresses</Title>
              {auth.can("procurement-supplier:manage") && (
                <FormDialog
                  title="Add address"
                  path={`/suppliers/${id}/addresses`}
                  fields={[
                    {
                      key: "type",
                      label: "Type",
                      required: true,
                      defaultValue: "REGISTERED",
                    },
                    {
                      key: "addressLine1",
                      label: "Address line 1",
                      required: true,
                    },
                    { key: "postalCode", label: "Postal code", required: true },
                    { key: "city", label: "City", required: true },
                    {
                      key: "countryCode",
                      label: "Country code",
                      required: true,
                    },
                  ]}
                />
              )}
            </Group>
            <State
              loading={addresses.isLoading}
              error={addresses.error}
              empty={!addresses.data?.length}
            >
              <DataTable
                headers={["Type", "Address", "City", "Country", "Status"]}
                rows={(addresses.data || []).map((a) => [
                  a.type,
                  a.addressLine1,
                  `${a.postalCode} ${a.city}`,
                  a.countryCode,
                  <Status value={a.status} />,
                ])}
              />
            </State>
            <Group justify="space-between">
              <Title order={4}>Contacts</Title>
              {auth.can("procurement-supplier:manage") && (
                <FormDialog
                  title="Add contact"
                  path={`/suppliers/${id}/contacts`}
                  fields={[
                    { key: "firstName", label: "First name", required: true },
                    { key: "lastName", label: "Last name", required: true },
                    {
                      key: "role",
                      label: "Role",
                      required: true,
                      defaultValue: "SALES",
                    },
                    { key: "email", label: "Email" },
                    { key: "phone", label: "Phone" },
                  ]}
                />
              )}
            </Group>
            <State
              loading={contacts.isLoading}
              error={contacts.error}
              empty={!contacts.data?.length}
            >
              <DataTable
                headers={["Name", "Role", "Email", "Phone", "Status"]}
                rows={(contacts.data || []).map((c) => [
                  `${c.firstName} ${c.lastName}`,
                  c.role,
                  c.email || "—",
                  c.phone || "—",
                  <Status value={c.active ? "ACTIVE" : "INACTIVE"} />,
                ])}
              />
            </State>
            <Group justify="space-between">
              <Title order={4}>Supplier products</Title>
              {auth.can("procurement-supplier:manage") && (
                <FormDialog
                  title="Add supplier product"
                  path={`/suppliers/${id}/products`}
                  fields={[
                    { key: "sku", label: "Invenlio SKU", required: true },
                    {
                      key: "supplierSku",
                      label: "Supplier SKU",
                      required: true,
                    },
                    {
                      key: "purchaseUnitCode",
                      label: "Purchase unit",
                      required: true,
                      defaultValue: "EA",
                    },
                    {
                      key: "baseUnitsPerPurchaseUnit",
                      label: "Base units per purchase unit",
                      required: true,
                      defaultValue: "1",
                    },
                    {
                      key: "unitCost",
                      label: "Unit cost",
                      required: true,
                      type: "number",
                    },
                    {
                      key: "currency",
                      label: "Currency",
                      required: true,
                      defaultValue: supplier.data.defaultCurrency,
                    },
                  ]}
                  transform={async (v) => {
                    const variant = await get<Variant>(
                      `/catalog/lookup?sku=${encodeURIComponent(v.sku)}`,
                    );
                    return { ...v, sku: undefined, variantId: variant.id };
                  }}
                />
              )}
            </Group>
            <State
              loading={mappings.isLoading}
              error={mappings.error}
              empty={!mappings.data?.length}
            >
              <DataTable
                headers={[
                  "Supplier SKU",
                  "Variant",
                  "Cost",
                  "Currency",
                  "Status",
                ]}
                rows={(mappings.data || []).map((m) => [
                  m.supplierSku,
                  m.variantId,
                  m.unitCost,
                  m.currency,
                  <Status value={m.active ? "ACTIVE" : "INACTIVE"} />,
                ])}
              />
            </State>
          </Stack>
        )}
      </State>
    </>
  );
}
