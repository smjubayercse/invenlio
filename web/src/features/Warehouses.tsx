import { Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useParams } from "react-router";
import type { Page } from "../api/client";
import type { Warehouse, Zone, Location } from "../api/types";
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
export function Warehouses() {
  const { id } = useParams();
  const auth = useAuth();
  const warehouse = useResource<Warehouse>(`/warehouses/${id}`, !!id);
  const zones = useResource<Page<Zone>>(`/warehouses/${id}/zones`, !!id);
  const locations = useResource<Page<Location>>(
    `/warehouses/${id}/locations`,
    !!id,
  );
  if (!id)
    return (
      <ResourceList<Warehouse>
        title="Warehouses"
        description="Physical sites and location topology."
        path="/warehouses"
        headers={["Code", "Warehouse", "Status", "Timezone"]}
        row={(w) => [
          <RecordLink to={`/warehouses/${w.id}`}>{w.code}</RecordLink>,
          w.name,
          <Status value={w.status} />,
          w.timezone || "—",
        ]}
        filters={{
          label: "Status",
          values: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"],
        }}
        action={
          auth.can("warehouse:create") && (
            <FormDialog
              title="Create warehouse"
              path="/warehouses"
              fields={[
                { key: "code", label: "Code", required: true },
                { key: "name", label: "Name", required: true },
                {
                  key: "timezone",
                  label: "Timezone",
                  required: true,
                  defaultValue: "UTC",
                },
                { key: "line1", label: "Address line 1" },
                { key: "postal", label: "Postal code" },
                { key: "city", label: "City" },
                { key: "country", label: "Country code" },
              ]}
            />
          )
        }
      />
    );
  return (
    <>
      <PageTitle
        title={warehouse.data?.name || "Warehouse"}
        action={<RecordLink to="/warehouses">Back to warehouses</RecordLink>}
      />
      <State loading={warehouse.isLoading} error={warehouse.error}>
        {warehouse.data && (
          <Stack>
            <Paper withBorder p="lg">
              <Group justify="space-between">
                <div>
                  <Title order={4}>{warehouse.data.code}</Title>
                  <Text c="dimmed">{warehouse.data.timezone}</Text>
                </div>
                <Status value={warehouse.data.status} />
              </Group>
              <Group mt="md">
                {auth.can("warehouse:update") && (
                  <FormDialog
                    title="Edit warehouse"
                    button="Edit"
                    method="PATCH"
                    path={`/warehouses/${id}`}
                    fields={[
                      {
                        key: "code",
                        label: "Code",
                        required: true,
                        defaultValue: warehouse.data.code,
                      },
                      {
                        key: "name",
                        label: "Name",
                        required: true,
                        defaultValue: warehouse.data.name,
                      },
                      {
                        key: "timezone",
                        label: "Timezone",
                        required: true,
                        defaultValue: warehouse.data.timezone,
                      },
                    ]}
                    transform={(v) => ({
                      ...v,
                      line1: warehouse.data!.addressLine1,
                      line2: warehouse.data!.addressLine2,
                      postal: warehouse.data!.postalCode,
                      city: warehouse.data!.city,
                      region: warehouse.data!.stateRegion,
                      country: warehouse.data!.countryCode,
                      version: warehouse.data!.version,
                    })}
                  />
                )}
                {auth.can("warehouse:update") &&
                  warehouse.data.status === "DRAFT" && (
                    <ConfirmAction
                      label="Activate"
                      path={`/warehouses/${id}/activate`}
                      version={warehouse.data.version}
                    />
                  )}
              </Group>
            </Paper>
            <Group justify="space-between">
              <Title order={4}>Zones</Title>
              {auth.can("warehouse-location:manage") && (
                <FormDialog
                  title="Create zone"
                  path={`/warehouses/${id}/zones`}
                  fields={[
                    { key: "code", label: "Code", required: true },
                    { key: "name", label: "Name", required: true },
                    {
                      key: "type",
                      label: "Type",
                      required: true,
                      type: "select",
                      options: [
                        "RECEIVING",
                        "STORAGE",
                        "PICKING",
                        "PACKING",
                        "SHIPPING",
                      ].map((value) => ({ value, label: value })),
                    },
                  ]}
                  transform={(v) => ({ ...v, sequence: 0 })}
                />
              )}
            </Group>
            <State
              loading={zones.isLoading}
              error={zones.error}
              empty={!zones.data?.content.length}
            >
              <DataTable
                headers={["Code", "Name", "Type", "Status", "Action"]}
                rows={(zones.data?.content || []).map((z) => [
                  z.code,
                  z.name,
                  z.type,
                  <Status value={z.status} />,
                  auth.can("warehouse-location:manage") ? (
                    <FormDialog
                      title="Edit zone"
                      button="Edit"
                      method="PATCH"
                      path={`/warehouse-zones/${z.id}`}
                      fields={[
                        {
                          key: "code",
                          label: "Code",
                          required: true,
                          defaultValue: z.code,
                        },
                        {
                          key: "name",
                          label: "Name",
                          required: true,
                          defaultValue: z.name,
                        },
                        {
                          key: "type",
                          label: "Type",
                          required: true,
                          defaultValue: z.type,
                        },
                        {
                          key: "sequence",
                          label: "Sequence",
                          type: "number",
                          defaultValue: String(z.sequence),
                        },
                      ]}
                      transform={(v) => ({
                        ...v,
                        sequence: Number(v.sequence),
                        version: z.version,
                      })}
                    />
                  ) : null,
                ])}
              />
            </State>
            <Group justify="space-between">
              <Title order={4}>Locations</Title>
              {auth.can("warehouse-location:manage") && (
                <FormDialog
                  title="Create location"
                  path={`/warehouses/${id}/locations`}
                  fields={[
                    {
                      key: "zoneId",
                      label: "Zone",
                      required: true,
                      type: "select",
                      options: (zones.data?.content || []).map((z) => ({
                        value: z.id,
                        label: z.name,
                      })),
                    },
                    { key: "code", label: "Code", required: true },
                    { key: "name", label: "Name" },
                    {
                      key: "type",
                      label: "Type",
                      required: true,
                      type: "select",
                      options: [
                        "AISLE",
                        "RACK",
                        "SHELF",
                        "BIN",
                        "FLOOR",
                        "PALLET_POSITION",
                        "STAGING",
                        "RECEIVING",
                        "PACKING",
                        "SHIPPING",
                      ].map((value) => ({ value, label: value })),
                    },
                    { key: "scanCode", label: "Scan code", required: true },
                  ]}
                  transform={(v) => ({ ...v, sequence: 0 })}
                />
              )}
            </Group>
            <State
              loading={locations.isLoading}
              error={locations.error}
              empty={!locations.data?.content.length}
            >
              <DataTable
                headers={[
                  "Code",
                  "Name",
                  "Type",
                  "Scan code",
                  "Status",
                  "Action",
                ]}
                rows={(locations.data?.content || []).map((l) => [
                  l.code,
                  l.name || "—",
                  l.type,
                  l.scanCode || "—",
                  <Status value={l.status} />,
                  auth.can("warehouse-location:manage") ? (
                    <FormDialog
                      title="Edit location"
                      button="Edit"
                      method="PATCH"
                      path={`/warehouse-locations/${l.id}`}
                      fields={[
                        {
                          key: "zoneId",
                          label: "Zone",
                          required: true,
                          type: "select",
                          options: (zones.data?.content || []).map((z) => ({
                            value: z.id,
                            label: z.name,
                          })),
                          defaultValue: l.zoneId,
                        },
                        { key: "name", label: "Name", defaultValue: l.name },
                        {
                          key: "type",
                          label: "Type",
                          required: true,
                          defaultValue: l.type,
                        },
                        {
                          key: "sequence",
                          label: "Sequence",
                          type: "number",
                          defaultValue: String(l.sequence),
                        },
                      ]}
                      transform={(v) => ({
                        ...v,
                        sequence: Number(v.sequence),
                        version: l.version,
                      })}
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
