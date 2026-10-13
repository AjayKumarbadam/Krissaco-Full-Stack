import { useEffect, useState } from "react";
import { History, Search } from "lucide-react";
import PageHeading from "../../components/common/PageHeading";
import Pagination from "../../components/common/Pagination";
import { getAuditLogs } from "../../api/audit";
import { ApiError } from "../../api/client";
import type { AuditLog } from "../../types";

interface AuditLogsViewProps {
  onToast: (variant: "success" | "error", text: string) => void;
}

export default function AuditLogsView({ onToast }: AuditLogsViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  async function loadLogs() {
    setIsLoading(true);
    try {
      const res = await getAuditLogs(200);
      setLogs(res.logs);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load audit logs.";
      onToast("error", message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = logs.filter((log) => {
    if (actionFilter !== "All" && !log.action.includes(actionFilter)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.actor_name.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.transaction_id && log.transaction_id.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filtered.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedLogs = filtered.slice(
    (validCurrentPage - 1) * pageSize,
    validCurrentPage * pageSize
  );

  return (
    <div>
      <PageHeading
        title="Audit Logs & Traceability"
        description="Immutable chronological record of all transactions, updates, approvals, and receipts."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-card border border-border bg-surface px-3 py-2">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, action, or details..."
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink"
        >
          <option value="All">All Actions</option>
          <option value="TRANSACTION_CREATED">Created</option>
          <option value="TRANSACTION_UPDATED">Updated</option>
          <option value="TRANSACTION_APPROVED">Approved</option>
          <option value="TRANSACTION_REJECTED">Rejected</option>
          <option value="RECEIPT_UPLOADED">Receipt Uploaded</option>
        </select>

        <button
          onClick={loadLogs}
          className="rounded-card border border-border bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-bg"
        >
          Refresh Logs
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-card border border-border bg-surface py-16 text-sm text-muted">
          Loading audit trail…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface py-16 text-center text-sm text-muted">
          <History className="h-8 w-8 text-muted" />
          <p className="font-medium text-ink">No audit logs recorded</p>
          <p className="text-xs">Transaction actions will automatically be recorded here.</p>
        </div>
      ) : (
        <div className="rounded-card border border-border bg-surface overflow-hidden shadow-xs">
          {/* Mobile Card List (screens < 768px) */}
          <div className="divide-y divide-border md:hidden">
            {displayedLogs.map((log) => {
              const date = new Date(log.timestamp);
              const formattedTime = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
              const formattedDate = date.toLocaleDateString();

              let actionBadgeColor = "bg-gray-100 text-gray-800";
              if (log.action.includes("APPROVED")) actionBadgeColor = "bg-emerald-100 text-emerald-800";
              else if (log.action.includes("REJECTED")) actionBadgeColor = "bg-rose-100 text-rose-800";
              else if (log.action.includes("CREATED")) actionBadgeColor = "bg-blue-100 text-blue-800";
              else if (log.action.includes("UPDATED")) actionBadgeColor = "bg-amber-100 text-amber-800";
              else if (log.action.includes("RECEIPT")) actionBadgeColor = "bg-purple-100 text-purple-800";

              return (
                <div key={log.id} className="p-4 space-y-2 bg-surface hover:bg-bg/40 transition-colors text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 font-medium ${actionBadgeColor}`}
                    >
                      {log.action.replace("TRANSACTION_", "").replace("_", " ")}
                    </span>
                    <span className="text-muted text-[11px] tabular">
                      {formattedDate} {formattedTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{log.actor_name}</span>
                    <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-[10px] font-semibold text-muted border border-border">
                      {log.actor_role}
                    </span>
                  </div>

                  <p className="font-mono text-xs text-ink/90 bg-bg/50 p-2 rounded border border-border/60">
                    {log.details || "No extra details"}
                  </p>

                  {log.transaction_id && (
                    <div className="text-[11px] text-muted text-right font-mono">
                      Txn: {log.transaction_id.slice(0, 8)}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (screens >= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold text-muted bg-surface/70">
                  <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                  <th className="px-4 py-3 whitespace-nowrap">Actor & Role</th>
                  <th className="px-4 py-3 whitespace-nowrap">Action</th>
                  <th className="px-4 py-3">Details & Changes</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {displayedLogs.map((log) => {
                  const date = new Date(log.timestamp);
                  const formattedTime = date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  const formattedDate = date.toLocaleDateString();

                  let actionBadgeColor = "bg-gray-100 text-gray-800";
                  if (log.action.includes("APPROVED")) actionBadgeColor = "bg-emerald-100 text-emerald-800";
                  else if (log.action.includes("REJECTED")) actionBadgeColor = "bg-rose-100 text-rose-800";
                  else if (log.action.includes("CREATED")) actionBadgeColor = "bg-blue-100 text-blue-800";
                  else if (log.action.includes("UPDATED")) actionBadgeColor = "bg-amber-100 text-amber-800";
                  else if (log.action.includes("RECEIPT")) actionBadgeColor = "bg-purple-100 text-purple-800";

                  return (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-0 hover:bg-bg/60 transition-colors text-xs"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-ink">
                        <div className="font-medium">{formattedDate}</div>
                        <div className="text-muted">{formattedTime}</div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-ink">{log.actor_name}</div>
                        <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-[10px] font-semibold text-muted border border-border">
                          {log.actor_role}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 font-medium ${actionBadgeColor}`}
                        >
                          {log.action.replace("TRANSACTION_", "").replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-ink max-w-md">
                        <p className="font-mono text-xs">{log.details || "No extra details"}</p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-[11px] text-muted">
                        {log.transaction_id ? log.transaction_id.slice(0, 8) + "..." : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <Pagination
              currentPage={validCurrentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 15, 25, 50]}
              itemLabel="audit logs"
            />
          )}
        </div>
      )}
    </div>
  );
}
