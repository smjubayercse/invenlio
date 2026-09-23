import { Alert, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useNavigate, useParams } from "react-router";
import type { PackingSession, PickList, Package } from "../api/types";
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
import { canPack, formatUnits, units } from "./workflow";
export function Packing() {
  const { id } = useParams();
  const nav = useNavigate();
  const auth = useAuth();
  const session = useResource<PackingSession>(`/packing-sessions/${id}`, !!id);
  const pick = useResource<PickList>(
    `/pick-lists/${session.data?.pickListId}`,
    !!session.data?.pickListId,
  );
  const completed = useResource<PickList[]>(
    "/pick-lists?status=COMPLETED&size=100",
  );
  if (!id)
    return (
      <ResourceList<PackingSession>
        title="Packing"
        description="Pack picked quantities into packages ready for shipping."
        path="/packing-sessions"
        headers={["Sales order", "Pick list", "Packages", "Status"]}
        row={(s) => [
          <RecordLink to={`/packing/${s.id}`}>
            {s.salesOrderId || s.pickListId}
          </RecordLink>,
          s.pickListId,
          s.packages?.length || 0,
          <Status value={s.status} />,
        ]}
        filters={{ label: "Status", values: ["OPEN", "PACKED"] }}
        search={false}
        action={
          auth.can("packing:manage") && (
            <FormDialog
              title="Open packing session"
              path="/packing-sessions"
              fields={[
                {
                  key: "pickListId",
                  label: "Completed pick list",
                  required: true,
                  type: "select",
                  options: (completed.data || []).map((p) => ({
                    value: p.id,
                    label: p.salesOrderNumber || p.id,
                  })),
                },
              ]}
              onSaved={(r) => nav(`/packing/${(r as PackingSession).id}`)}
            />
          )
        }
      />
    );
  const tasks = pick.data?.tasks || [];
  const packed = new Map<string, bigint>();
  session.data?.packages.forEach((p) =>
    p.items.forEach((i) =>
      packed.set(
        i.pickTaskId,
        (packed.get(i.pickTaskId) || 0n) + units(i.quantity),
      ),
    ),
  );
  return (
    <>
      <PageTitle
        title="Packing session"
        action={<RecordLink to="/packing">Back to packing</RecordLink>}
      />
      <State loading={session.isLoading} error={session.error}>
        {session.data && (
          <Stack>
            <Paper withBorder p="lg">
              <Group justify="space-between">
                <div>
                  <Text>Sales order {session.data.salesOrderId}</Text>
                  <Text size="sm" c="dimmed">
                    Pick list {session.data.pickListId}
                  </Text>
                </div>
                <Status value={session.data.status} />
              </Group>
              <Group mt="md">
                {auth.can("packing:manage") &&
                  session.data.status !== "PACKED" && (
                    <FormDialog
                      title="Create package"
                      path={`/packing-sessions/${id}/packages`}
                      fields={[
                        {
                          key: "weightGrams",
                          label: "Weight (g)",
                          type: "number",
                        },
                        {
                          key: "lengthMm",
                          label: "Length (mm)",
                          type: "number",
                        },
                        { key: "widthMm", label: "Width (mm)", type: "number" },
                        {
                          key: "heightMm",
                          label: "Height (mm)",
                          type: "number",
                        },
                      ]}
                      transform={(v) =>
                        Object.fromEntries(
                          Object.entries(v)
                            .filter(([, value]) => value)
                            .map(([key, value]) => [key, Number(value)]),
                        )
                      }
                    />
                  )}
                {auth.can("packing:manage") &&
                  session.data.status !== "PACKED" &&
                  session.data.packages.length > 0 && (
                    <ConfirmAction
                      label="Complete packing"
                      path={`/packing-sessions/${id}/complete`}
                      version={session.data.version}
                    />
                  )}
              </Group>
            </Paper>
            <Title order={4}>Picked quantities</Title>
            <DataTable
              headers={["Variant", "Picked", "Packed", "Remaining"]}
              rows={tasks.map((t) => [
                t.variantId,
                t.pickedQuantity,
                formatUnits(packed.get(t.id) || 0n),
                formatUnits(units(t.pickedQuantity) - (packed.get(t.id) || 0n)),
              ])}
            />
            <Title order={4}>Packages</Title>
            {session.data.packages.map((p) => (
              <PackageCard
                key={p.id}
                packageData={p}
                sessionId={id!}
                tasks={tasks}
                packed={packed}
                canManage={
                  auth.can("packing:manage") &&
                  session.data!.status !== "PACKED"
                }
              />
            ))}
            {!session.data.packages.length && (
              <Alert color="gray">Create a package to begin packing.</Alert>
            )}
          </Stack>
        )}
      </State>
    </>
  );
}
function PackageCard({
  packageData,
  sessionId,
  tasks,
  packed,
  canManage,
}: {
  packageData: Package;
  sessionId: string;
  tasks: PickList["tasks"];
  packed: Map<string, bigint>;
  canManage: boolean;
}) {
  const eligible = tasks.filter(
    (t) => units(t.pickedQuantity) > (packed.get(t.id) || 0n),
  );
  return (
    <Paper withBorder p="lg">
      <Group justify="space-between">
        <Title order={5}>{packageData.packageNumber}</Title>
        <Status value={packageData.status} />
      </Group>
      <Stack mt="md">
        <State empty={!packageData.items.length}>
          <DataTable
            headers={["Pick task", "Quantity"]}
            rows={packageData.items.map((i) => [i.pickTaskId, i.quantity])}
          />
        </State>
        <Group>
          {canManage &&
            packageData.status !== "PACKED" &&
            eligible.length > 0 && (
              <FormDialog
                title="Add item to package"
                path={`/packing-sessions/${sessionId}/packages/${packageData.id}/items`}
                fields={[
                  {
                    key: "pickTaskId",
                    label: "Picked task",
                    required: true,
                    type: "select",
                    options: eligible.map((t) => ({
                      value: t.id,
                      label: `${t.variantId} · ${formatUnits(units(t.pickedQuantity) - (packed.get(t.id) || 0n))} available`,
                    })),
                  },
                  {
                    key: "quantity",
                    label: "Quantity",
                    required: true,
                    type: "number",
                  },
                ]}
                transform={(v) => {
                  const task = tasks.find((t) => t.id === v.pickTaskId);
                  const max =
                    units(task?.pickedQuantity || "0") -
                    (packed.get(v.pickTaskId) || 0n);
                  if (
                    !canPack(
                      task?.pickedQuantity || "0",
                      formatUnits(packed.get(v.pickTaskId) || 0n),
                      v.quantity,
                    )
                  )
                    throw new Error(
                      `Only ${formatUnits(max)} picked units remain.`,
                    );
                  return v;
                }}
              />
            )}
          {canManage &&
            packageData.status !== "PACKED" &&
            packageData.items.length > 0 && (
              <ConfirmAction
                label="Seal package"
                path={`/packing-sessions/${sessionId}/packages/${packageData.id}/complete`}
                version={packageData.version}
              />
            )}
        </Group>
      </Stack>
    </Paper>
  );
}
