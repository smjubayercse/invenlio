import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  TextInput,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api } from "../api/client";
import { positiveQuantity } from "../features/workflow";
export type Field = {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "number" | "date" | "textarea" | "select";
  options?: { value: string; label: string }[];
  defaultValue?: string;
};
export function FormDialog({
  title,
  path,
  method = "POST",
  fields,
  button = "Create",
  onSaved,
  transform,
}: {
  title: string;
  path: string;
  method?: "POST" | "PATCH";
  fields: Field[];
  button?: string;
  onSaved?: (result: unknown) => void;
  transform?: (values: Record<string, string>) => unknown | Promise<unknown>;
}) {
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const client = useQueryClient();
  const value = (field: Field) =>
    String(values[field.key] ?? field.defaultValue ?? "");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    const missing = fields.find(
      (field) => field.required && !value(field).trim(),
    );
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    const invalid = fields.find(
      (field) =>
        field.type === "number" &&
        field.required &&
        !positiveQuantity(value(field)),
    );
    if (invalid) {
      setError(`${invalid.label} must be greater than zero.`);
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const resolvedValues = Object.fromEntries(
        fields.map((field) => [field.key, value(field)]),
      );
      const body = transform ? await transform(resolvedValues) : resolvedValues;
      const result = await api(path, {
        method,
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      notifications.show({
        title: "Saved",
        message: `${title} saved successfully.`,
        color: "green",
      });
      setOpened(false);
      setValues({});
      await client.invalidateQueries();
      onSaved?.(result);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to save.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        onClick={() => {
          setError("");
          setOpened(true);
        }}
      >
        {button}
      </Button>
      <Modal
        opened={opened}
        onClose={() => {
          if (!submitting.current) setOpened(false);
        }}
        title={title}
        centered
        size="lg"
      >
        <form onSubmit={(event) => void submit(event)}>
          <Stack>
            {fields.map((field) =>
              field.type === "select" ? (
                <Select
                  key={field.key}
                  label={field.label}
                  required={field.required}
                  data={field.options || []}
                  searchable
                  value={value(field)}
                  onChange={(v) =>
                    setValues((previous) => ({
                      ...previous,
                      [field.key]: v || "",
                    }))
                  }
                />
              ) : field.type === "textarea" ? (
                <Textarea
                  key={field.key}
                  label={field.label}
                  required={field.required}
                  value={value(field)}
                  onChange={(event) => {
                    const next = event.currentTarget.value;
                    setValues((previous) => ({
                      ...previous,
                      [field.key]: next,
                    }));
                  }}
                />
              ) : (
                <TextInput
                  key={field.key}
                  label={field.label}
                  required={field.required}
                  type={field.type || "text"}
                  value={value(field)}
                  onChange={(event) => {
                    const next = event.currentTarget.value;
                    setValues((previous) => ({
                      ...previous,
                      [field.key]: next,
                    }));
                  }}
                />
              ),
            )}
            {error && (
              <div role="alert" style={{ color: "#c92a2a" }}>
                {error}
              </div>
            )}
            <Group justify="end">
              <Button
                variant="default"
                disabled={busy}
                onClick={() => setOpened(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
