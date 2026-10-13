import { useEffect, useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal, CheckCircle2, Clock, XCircle, ListFilter } from "lucide-react";
import PageHeading from "../../components/common/PageHeading";
import ActionButton from "../../components/common/ActionButton";
import TransactionTable from "../../components/tables/TransactionTable";
import TransactionModal from "../../components/modals/TransactionModal";
import {
  getLatestTransactions,
  approveTransaction,
  rejectTransaction,
} from "../../api/transactions";
import { ApiError } from "../../api/client";
import { TRANSACTION_HEADS, LIMIT_OPTIONS, DEFAULT_PAGE_LIMIT } from "../../constants";
import type { Transaction, TransactionHead, TransactionType } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface TransactionsViewProps {
  onToast: (variant: "success" | "error", text: string) => void;
}

export default function TransactionsView({ onToast }: TransactionsViewProps) {
  const { user, role } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_LIMIT);
  const [statusTab, setStatusTab] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "All">("All");
  const [headFilter, setHeadFilter] = useState<TransactionHead | "All">("All");

  async function load(currentLimit: number) {
    setIsLoading(true);
    try {
      const res = await getLatestTransactions(currentLimit);
      setTransactions(res.transactions);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not load transactions.";
      onToast("error", message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, user]);

  // Handler for Manager Approval
  async function handleApprove(transaction: Transaction) {
    try {
      const updated = await approveTransaction(transaction.TransactionID);
      setTransactions((prev) =>
        prev.map((t) => (t.TransactionID === updated.TransactionID ? updated : t))
      );
      onToast("success", `Transaction for ${transaction.Vendor} approved.`);
    } catch (err: any) {
      onToast("error", err.message || "Failed to approve transaction.");
    }
  }

  // Handler for Manager Rejection
  async function handleReject(transaction: Transaction, reason: string) {
    try {
      const updated = await rejectTransaction(transaction.TransactionID, reason);
      setTransactions((prev) =>
        prev.map((t) => (t.TransactionID === updated.TransactionID ? updated : t))
      );
      onToast("success", `Transaction for ${transaction.Vendor} rejected.`);
    } catch (err: any) {
      onToast("error", err.message || "Failed to reject transaction.");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (statusTab !== "All" && t.Status !== statusTab) return false;
      if (typeFilter !== "All" && t.TransactionType !== typeFilter) return false;
      if (headFilter !== "All" && t.TransactionHead !== headFilter) return false;
      if (!q) return true;
      return (
        t.Description.toLowerCase().includes(q) ||
        t.Vendor.toLowerCase().includes(q) ||
        t.TransactionHead.toLowerCase().includes(q) ||
        (t.CreatedByName && t.CreatedByName.toLowerCase().includes(q))
      );
    });
  }, [transactions, search, statusTab, typeFilter, headFilter]);

  const pendingCount = useMemo(
    () => transactions.filter((t) => t.Status === "Pending").length,
    [transactions]
  );
  const approvedCount = useMemo(
    () => transactions.filter((t) => t.Status === "Approved").length,
    [transactions]
  );
  const rejectedCount = useMemo(
    () => transactions.filter((t) => t.Status === "Rejected").length,
    [transactions]
  );

  const activeFilterCount =
    (typeFilter !== "All" ? 1 : 0) + (headFilter !== "All" ? 1 : 0) + (limit !== DEFAULT_PAGE_LIMIT ? 1 : 0);

  return (
    <div>
      <PageHeading
        title={role === "Manager" ? "Transaction Approvals & Review" : "Transactions"}
        description={
          role === "Accountant"
            ? "Record new transactions, upload receipts, and manage your pending submissions."
            : role === "Manager"
            ? "Review submissions, examine supporting receipts, and approve or reject entries."
            : "Review complete system financial entries and audit trail."
        }
        action={
          role === "Accountant" ? (
            <ActionButton
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingTransaction(null);
                setModalOpen(true);
              }}
            >
              Add transaction
            </ActionButton>
          ) : undefined
        }
      />

      {/* Status Filter Tabs */}
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3 overflow-x-auto py-0.5">
        <button
          onClick={() => setStatusTab("All")}
          className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            statusTab === "All"
              ? "bg-ink text-white shadow-xs"
              : "bg-surface text-muted hover:bg-bg border border-border"
          }`}
        >
          <ListFilter className="h-3.5 w-3.5" />
          All ({transactions.length})
        </button>

        <button
          onClick={() => setStatusTab("Pending")}
          className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            statusTab === "Pending"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Pending Approvals ({pendingCount})
        </button>

        <button
          onClick={() => setStatusTab("Approved")}
          className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            statusTab === "Approved"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Approved ({approvedCount})
        </button>

        <button
          onClick={() => setStatusTab("Rejected")}
          className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            statusTab === "Rejected"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
          }`}
        >
          <XCircle className="h-3.5 w-3.5" />
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-card border border-border bg-surface px-3 py-2">
          <Search className="h-4 w-4 text-muted shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by description, vendor, head, or creator"
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </div>

        <button
          onClick={() => setFiltersOpen((prev) => !prev)}
          className={`flex items-center justify-center gap-2 rounded-card border px-3 py-2 text-sm font-medium transition-colors shrink-0 ${
            filtersOpen || activeFilterCount > 0
              ? "border-accent bg-accent/10 text-accent-dark"
              : "border-border bg-surface text-ink hover:bg-bg"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <div className="animate-fade-in mb-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 items-end gap-3 rounded-card border border-border bg-surface p-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Fetch Limit</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink"
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} latest records
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Type</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType | "All")}
              className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="All">All</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Head</span>
            <select
              value={headFilter}
              onChange={(e) => setHeadFilter(e.target.value as TransactionHead | "All")}
              className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="All">All</option>
              {TRANSACTION_HEADS.map((head: string) => (
                <option key={head} value={head}>
                  {head}
                </option>
              ))}
            </select>
          </label>

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setLimit(DEFAULT_PAGE_LIMIT);
                setTypeFilter("All");
                setHeadFilter("All");
              }}
              className="text-sm font-medium text-accent-dark hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* Transactions Table with Role-Based Actions */}
      <TransactionTable
        transactions={filtered}
        isLoading={isLoading}
        onEdit={(txn) => {
          setEditingTransaction(txn);
          setModalOpen(true);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Transaction Create / Edit Modal */}
      {modalOpen && (
        <TransactionModal
          initialTransaction={editingTransaction}
          onClose={() => {
            setModalOpen(false);
            setEditingTransaction(null);
          }}
          onSaved={(saved, isNew) => {
            if (isNew) {
              setTransactions((prev) => [saved, ...prev]);
              onToast("success", "Transaction recorded with Pending status.");
            } else {
              setTransactions((prev) =>
                prev.map((t) => (t.TransactionID === saved.TransactionID ? saved : t))
              );
              onToast("success", "Transaction updated.");
            }
          }}
          onError={(message) => onToast("error", message)}
        />
      )}
    </div>
  );
}