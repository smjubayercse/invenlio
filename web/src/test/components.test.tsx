import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { App } from "../app/App";
import { ConfirmAction } from "../components/Actions";
import { FormDialog } from "../components/FormDialog";
const login = vi.fn();
vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    loading: false,
    authenticated: false,
    login,
    logout: vi.fn(),
    can: () => false,
  }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function providers(child: React.ReactNode) {
  return (
    <MantineProvider>
      <ModalsProvider>
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>{child}</MemoryRouter>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}
describe("authenticated shell", () => {
  it("requires sign-in before rendering protected routes", () => {
    render(providers(<App />));
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("Purchase orders")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(login).toHaveBeenCalledOnce();
  });
});
describe("dispatch confirmation", () => {
  it("shows the irreversible inventory warning before dispatch", async () => {
    render(
      providers(
        <ConfirmAction
          label="Dispatch"
          path="/shipments/one/dispatch"
          warning="Dispatch removes these items from physical warehouse inventory and cannot be reversed in V1."
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Dispatch" }));
    expect(
      await screen.findByText(/cannot be reversed in V1/),
    ).toBeInTheDocument();
  });
});
describe("form defaults", () => {
  it("submits visible defaults even when the operator does not edit them", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    render(
      providers(
        <FormDialog
          title="Create product"
          path="/products"
          fields={[
            {
              key: "baseUnit",
              label: "Base unit",
              required: true,
              defaultValue: "EA",
            },
          ]}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    fireEvent.click(await screen.findByRole("button", { name: "Save" }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
    expect(
      JSON.parse((fetcher.mock.calls[0][1] as RequestInit).body as string),
    ).toEqual({ baseUnit: "EA" });
    vi.unstubAllGlobals();
  });
  it("does not send a second request while the first save is pending", async () => {
    let finish!: (response: Response) => void;
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetcher);
    render(
      providers(
        <FormDialog title="Create product" path="/products" fields={[]} />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    const form = (await screen.findByRole("button", { name: "Save" })).closest(
      "form",
    )!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(fetcher).toHaveBeenCalledOnce();
    finish(new Response("{}", { status: 200 }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    vi.unstubAllGlobals();
  });
});
