"use client";

import { useState, useCallback } from "react";
import { ChevronUp, ChevronDown, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";

export interface Column<T> {
  key: keyof T;
  label: string;
  format?: "number" | "currency" | "string";
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T extends object> {
  title: string;
  columns: Column<T>[];
  rows: T[];
  defaultSortKey?: keyof T;
  loading?: boolean;
  pageSize?: number;
}

export function DataTable<T extends object>({
  title,
  columns,
  rows,
  defaultSortKey,
  loading,
  pageSize = 10,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const exportCSV = useCallback(() => {
    const header = columns.map((c) => c.label).join(",");
    const rowsCSV = rows.map((row) =>
      columns.map((c) => {
        const v = row[c.key];
        const s = String(v ?? "");
        return s.includes(",") ? `"${s}"` : s;
      }).join(",")
    );
    const blob = new Blob([[header, ...rowsCSV].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, columns, title]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey] as unknown as number | string;
    const bv = b[sortKey] as unknown as number | string;
    const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const formatCell = (value: unknown, format?: "number" | "currency" | "string") => {
    if (value === null || value === undefined) return "—";
    if (format === "currency") return formatCurrency(value as number);
    if (format === "number") return formatCompact(value as number);
    return String(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground",
                      col.sortable !== false && "cursor-pointer select-none hover:text-foreground",
                      col.className
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable !== false && sortKey === col.key && (
                        sortDir === "desc" ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronUp className="h-3 w-3" />
                        )
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "px-4 py-2.5 tabular-nums",
                        col.format !== "string" && "text-right first:text-left",
                        col.className
                      )}
                    >
                      {formatCell(row[col.key], col.format)}
                    </td>
                  ))}
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6 text-center text-muted-foreground">
                    No data for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
              >
                &lt;
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
