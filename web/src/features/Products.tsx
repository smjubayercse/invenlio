import { Badge, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useParams } from "react-router";
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
import type { Page } from "../api/client";
import type { Product, Variant, Barcode } from "../api/types";
export function Products() {
  const { id } = useParams();
  const auth = useAuth();
  const product = useResource<Product>(`/products/${id}`, !!id);
  const variants = useResource<Page<Variant>>(`/products/${id}/variants`, !!id);
  if (!id)
    return (
      <ResourceList<Product>
        title="Products"
        description="Manage products, SKUs and tracking policies."
        path="/products"
        sortOptions={[
          { value: "name", label: "Name" },
          { value: "createdAt", label: "Created" },
          { value: "updatedAt", label: "Updated" },
        ]}
        headers={["Product", "Status", "Base unit", "Updated"]}
        row={(p) => [
          <RecordLink to={`/products/${p.id}`}>{p.name}</RecordLink>,
          <Status value={p.status} />,
          p.baseUnit || "—",
          p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "—",
        ]}
        filters={{
          label: "Status",
          values: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"],
        }}
        action={
          auth.can("catalog:create") ? (
            <FormDialog
              title="Create product"
              path="/products"
              fields={[
                { key: "name", label: "Product name", required: true },
                { key: "description", label: "Description", type: "textarea" },
                {
                  key: "baseUnit",
                  label: "Base unit",
                  required: true,
                  defaultValue: "EA",
                },
                { key: "sku", label: "Initial SKU", required: true },
                { key: "displayName", label: "Variant name" },
                {
                  key: "trackingMode",
                  label: "Tracking",
                  type: "select",
                  options: ["NONE", "LOT", "SERIAL", "LOT_AND_SERIAL"].map(
                    (value) => ({ value, label: value }),
                  ),
                  defaultValue: "NONE",
                },
                {
                  key: "expirationRequired",
                  label: "Expiry required",
                  type: "select",
                  options: [
                    { value: "false", label: "No" },
                    { value: "true", label: "Yes" },
                  ],
                  defaultValue: "false",
                },
              ]}
              transform={(v) => ({
                name: v.name,
                description: v.description,
                baseUnit: v.baseUnit,
                initialVariant: {
                  sku: v.sku,
                  displayName: v.displayName || v.name,
                  baseUnit: v.baseUnit,
                  trackingMode: v.trackingMode || "NONE",
                  expirationRequired: v.expirationRequired === "true",
                },
              })}
            />
          ) : null
        }
      />
    );
  return (
    <>
      <PageTitle
        title={product.data?.name || "Product"}
        description="Product details and SKUs"
        action={<RecordLink to="/products">Back to products</RecordLink>}
      />
      <State loading={product.isLoading} error={product.error}>
        {product.data && (
          <Stack>
            <Paper withBorder p="lg">
              <Group justify="space-between">
                <div>
                  <Title order={4}>{product.data.name}</Title>
                  <Text c="dimmed">
                    {product.data.description || "No description"}
                  </Text>
                </div>
                <Status value={product.data.status} />
              </Group>
              <Text size="sm" mt="md">
                Base unit: {product.data.baseUnit}
              </Text>
              <Group mt="md">
                {auth.can("catalog:update") &&
                  product.data.status === "DRAFT" && (
                    <ConfirmAction
                      label="Activate"
                      path={`/products/${id}/activate`}
                      version={product.data.version}
                    />
                  )}
              </Group>
            </Paper>
            <Group justify="space-between">
              <Title order={4}>Variants / SKUs</Title>
              {auth.can("catalog:update") && (
                <FormDialog
                  title="Add variant"
                  path={`/products/${id}/variants`}
                  fields={[
                    { key: "sku", label: "SKU", required: true },
                    { key: "displayName", label: "Display name" },
                    {
                      key: "baseUnit",
                      label: "Base unit",
                      defaultValue: product.data.baseUnit,
                    },
                    {
                      key: "trackingMode",
                      label: "Tracking",
                      type: "select",
                      options: ["NONE", "LOT", "SERIAL", "LOT_AND_SERIAL"].map(
                        (value) => ({ value, label: value }),
                      ),
                      defaultValue: "NONE",
                    },
                    {
                      key: "expirationRequired",
                      label: "Expiry required",
                      type: "select",
                      options: [
                        { value: "false", label: "No" },
                        { value: "true", label: "Yes" },
                      ],
                      defaultValue: "false",
                    },
                  ]}
                  transform={(v) => ({
                    ...v,
                    expirationRequired: v.expirationRequired === "true",
                  })}
                />
              )}
            </Group>
            <State
              loading={variants.isLoading}
              error={variants.error}
              empty={!variants.data?.content.length}
            >
              <DataTable
                headers={[
                  "SKU",
                  "Name",
                  "Tracking",
                  "Status",
                  "Barcode",
                  "Action",
                ]}
                rows={(variants.data?.content || []).map((v) => [
                  <span className="mono">{v.sku}</span>,
                  v.displayName,
                  <Badge variant="outline">{v.trackingMode || "NONE"}</Badge>,
                  <Status value={v.status} />,
                  <BarcodeCell
                    variantId={v.id}
                    canEdit={auth.can("catalog:update")}
                  />,
                  auth.can("catalog:update") && v.status === "DRAFT" ? (
                    <ConfirmAction
                      label="Activate SKU"
                      path={`/variants/${v.id}/activate`}
                      version={v.version}
                    />
                  ) : null,
                ])}
              />
            </State>
          </Stack>
        )}
      </State>
    </>
  );
}
function BarcodeCell({
  variantId,
  canEdit,
}: {
  variantId: string;
  canEdit: boolean;
}) {
  const barcodes = useResource<Barcode[]>(`/variants/${variantId}/barcodes`);
  return (
    <Group gap="xs">
      {barcodes.data?.map((b) => (
        <Text size="xs" key={b.id}>
          {b.value}
        </Text>
      ))}
      {canEdit && (
        <FormDialog
          title="Add barcode"
          button="Add"
          path={`/variants/${variantId}/barcodes`}
          fields={[
            {
              key: "type",
              label: "Type",
              required: true,
              type: "select",
              options: [
                "GTIN_8",
                "GTIN_12",
                "GTIN_13",
                "GTIN_14",
                "CODE_128",
                "INTERNAL",
              ].map((value) => ({ value, label: value })),
              defaultValue: "INTERNAL",
            },
            { key: "value", label: "Code", required: true },
          ]}
          transform={(v) => ({ ...v, primary: !barcodes.data?.length })}
        />
      )}
    </Group>
  );
}
