import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Button } from "@mantine/core";
import { post, mutationKey } from "../api/client";
export function useAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      path,
      body,
      idempotent,
    }: {
      path: string;
      body?: unknown;
      idempotent?: boolean;
    }) => post(path, body ?? {}, idempotent ? mutationKey() : undefined),
    onSuccess: async () => {
      notifications.show({
        title: "Saved",
        message: "The operation completed successfully.",
        color: "green",
      });
      await client.invalidateQueries();
    },
    onError: (error: Error) =>
      notifications.show({
        title: "Operation failed",
        message: error.message,
        color: "red",
      }),
  });
}
export function ConfirmAction({
  label,
  title,
  warning,
  path,
  version,
  disabled,
  idempotent,
  color,
}: {
  label: string;
  title?: string;
  warning?: string;
  path: string;
  version?: number;
  disabled?: boolean;
  idempotent?: boolean;
  color?: string;
}) {
  const action = useAction();
  const [open, setOpen] = useState(false);
  const inFlight = useRef(false);
  return (
    <Button
      disabled={disabled || open || action.isPending}
      loading={action.isPending}
      color={color}
      variant="light"
      onClick={() => {
        if (inFlight.current) return;
        inFlight.current = true;
        setOpen(true);
        modals.openConfirmModal({
          title: title || label,
          children:
            warning || `Are you sure you want to ${label.toLowerCase()}?`,
          labels: { confirm: label, cancel: "Keep current state" },
          confirmProps: { color: color || "indigo" },
          onCancel: () => {
            inFlight.current = false;
            setOpen(false);
          },
          onConfirm: () => {
            setOpen(false);
            action.mutate(
              { path, body: { version }, idempotent },
              {
                onSettled: () => {
                  inFlight.current = false;
                },
              },
            );
          },
        });
      }}
      data-dialog-open={open}
    >
      {label}
    </Button>
  );
}
