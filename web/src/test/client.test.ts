import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, configureApi } from "../api/client";
afterEach(() => {
  vi.unstubAllGlobals();
  configureApi(
    () => undefined,
    () => undefined,
  );
});
describe("API client", () => {
  it("sends the bearer token without persisting it", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    configureApi(
      () => "session-token",
      () => undefined,
    );
    await api("/me");
    const headers = (fetcher.mock.calls[0][1] as RequestInit)
      .headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer session-token");
  });
  it("shows RFC7807 detail rather than raw JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            title: "Bad request",
            detail: "Quantity exceeds available stock",
          }),
          { status: 422 },
        ),
      ),
    );
    await expect(api("/test")).rejects.toMatchObject({
      message: "Quantity exceeds available stock",
      status: 422,
    } satisfies Partial<ApiError>);
  });
  it("notifies authentication on 401", async () => {
    const expired = vi.fn();
    configureApi(() => undefined, expired);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
    );
    await expect(api("/me")).rejects.toBeInstanceOf(ApiError);
    expect(expired).toHaveBeenCalledOnce();
  });
  it("presents validation field messages without raw problem JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            title: "Validation failed",
            errors: [{ field: "quantity", message: "must be positive" }],
          }),
          { status: 400 },
        ),
      ),
    );
    await expect(api("/test")).rejects.toThrow("quantity must be positive");
  });
});
