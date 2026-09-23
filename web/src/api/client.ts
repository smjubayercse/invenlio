export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors: { field: string; message: string }[] = [],
  ) {
    super(message);
  }
}
let token: () => string | undefined = () => undefined;
let unauthorized: () => void = () => undefined;
export function configureApi(
  accessToken: () => string | undefined,
  onUnauthorized: () => void,
) {
  token = accessToken;
  unauthorized = onUnauthorized;
}
const base = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (token()) headers.set("Authorization", `Bearer ${token()}`);
  const response = await fetch(`${base}${path}`, { ...init, headers });
  if (response.status === 401) unauthorized();
  if (!response.ok) {
    let problem: Record<string, unknown> = {};
    try {
      problem = (await response.json()) as Record<string, unknown>;
    } catch {
      /* Proxy errors may not be JSON. */
    }
    const fieldErrors = Array.isArray(problem.errors)
      ? problem.errors.filter(
          (item): item is { field: string; message: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof item.field === "string" &&
            typeof item.message === "string",
        )
      : [];
    const message =
      typeof problem.detail === "string"
        ? problem.detail
        : typeof problem.title === "string"
          ? problem.title
          : `Request failed (${response.status})`;
    throw new ApiError(
      fieldErrors.length
        ? `${message}: ${fieldErrors
            .slice(0, 3)
            .map((item) => `${item.field} ${item.message}`)
            .join("; ")}`
        : message,
      response.status,
      fieldErrors,
    );
  }
  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}
export const get = <T>(path: string, signal?: AbortSignal) =>
  api<T>(path, { signal });
export const post = <T>(path: string, body: unknown, idempotencyKey?: string) =>
  api<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
export const patch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });
export function query(
  params: Record<string, string | number | undefined | null>,
) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  return `?${q}`;
}
export const mutationKey = () => crypto.randomUUID();
