import { useQuery } from "@tanstack/react-query";
import { Button, Group, Select, TextInput } from "@mantine/core";
import { useState, type ReactNode } from "react";
import { get, query, type Page } from "../api/client";
import { DataTable, PageControls, PageTitle, State } from "./Ui";
export function useResource<T>(path: string, enabled = true) {
  return useQuery({
    queryKey: [path],
    queryFn: ({ signal }) => get<T>(path, signal),
    enabled,
  });
}
export function ResourceList<T extends { id: string; status?: string }>({
  title,
  description,
  path,
  headers,
  row,
  action,
  filters,
  search = true,
  sortOptions,
}: {
  title: string;
  description?: string;
  path: string;
  headers: string[];
  row: (item: T) => ReactNode[];
  action?: ReactNode;
  filters?: { label: string; values: string[] };
  search?: boolean;
  sortOptions?: { value: string; label: string }[];
}) {
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | null>("");
  const [sort, setSort] = useState<string | null>(null);
  const url =
    path +
    query({
      page,
      size: 20,
      ...(search ? { q } : {}),
      status: status || undefined,
      sort: sort || undefined,
    });
  const data = useResource<Page<T> | T[]>(url);
  const records = data.data
    ? Array.isArray(data.data)
      ? data.data
      : data.data.content
    : [];
  const totalPages =
    data.data && !Array.isArray(data.data)
      ? data.data.totalPages
      : records.length === 20
        ? page + 2
        : page + 1;
  return (
    <>
      <PageTitle title={title} description={description} action={action} />
      <Group mb="md">
        {search && (
          <TextInput
            placeholder="Search"
            aria-label={`Search ${title}`}
            value={q}
            onChange={(event) => {
              setQ(event.currentTarget.value);
              setPage(0);
            }}
          />
        )}
        {filters && (
          <Select
            placeholder={filters.label}
            aria-label={filters.label}
            clearable
            value={status}
            data={filters.values}
            onChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
          />
        )}
        {sortOptions && (
          <Select
            placeholder="Sort by"
            aria-label="Sort by"
            clearable
            value={sort}
            data={sortOptions}
            onChange={(value) => {
              setSort(value);
              setPage(0);
            }}
          />
        )}
        <Button variant="subtle" onClick={() => void data.refetch()}>
          Refresh
        </Button>
      </Group>
      <State
        loading={data.isLoading}
        error={data.error}
        empty={!records.length}
      >
        <DataTable headers={headers} rows={records.map(row)} />
      </State>
      <PageControls page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
