import { useState, useEffect } from "react";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Edit2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { formatAmount, formatTransactionDate } from "../../utils/formatters";
import type { Transaction } from "../../types";
import { useAuth } from "../../context/AuthContext";
import ReceiptViewerModal from "../modals/ReceiptViewerModal";
import RejectModal from "../modals/RejectModal";
import Pagination from "../common/Pagination";

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit?: (transaction: Transaction) => void;
  onApprove?: (transaction: Transaction) => void;
  onReject?: (transaction: Transaction, reason: string) => Promise<void>;
  pageSize?: number;
  pageSizeOptions?: readonly number[] | number[];
  showPagination?: boolean;
}

export default function TransactionTable({
  transactions,
  isLoading,
  onEdit,
  onApprove,
  onReject,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  showPagination = true,
}: TransactionTableProps) {
  const { user, role } = useAuth();
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [rejectingTxn, setRejectingTxn] = useState<Transaction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset to first page when transactions dataset changes
  useEffect(() => {
    setCurrentPage(1);
  }, [transactions.length]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedTransactions = showPagination
    ? transactions.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize)
    : transactions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-card border border-border bg-surface py-16 text-sm text-muted">
        Loading transactions…
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface py-16 text-center">
        <Inbox className="h-6 w-6 text-muted" />
        <p className="text-sm font-medium text-ink">No transactions found</p>
        <p className="text-sm text-muted">Transactions will appear here once recorded.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-card border border-border bg-surface overflow-hidden shadow-xs">
        {/* Mobile View: Responsive Card List (screens < 768px) */}
        <div className="divide-y divide-border md:hidden">
          {displayedTransactions.map((t) => {
            const isCreator = user?.username === t.CreatedBy;
            const isPending = t.Status === "Pending";
            const isApproved = t.Status === "Approved";
            const isRejected = t.Status === "Rejected";

            return (
              <div
                key={t.TransactionID}
                className="p-4 space-y-2.5 bg-surface hover:bg-bg/40 transition-colors"
              >
                {/* Header: Date, Badges & Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-ink tabular">
                      {formatTransactionDate(t.TransactionDate)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800"
                          : isRejected
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="h-3 w-3" />}
                      {isRejected && <XCircle className="h-3 w-3" />}
                      {isPending && <Clock className="h-3 w-3" />}
                      {t.Status}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        t.TransactionType === "Revenue"
                          ? "bg-revenue/10 text-revenue"
                          : "bg-expense/10 text-expense"
                      }`}
                    >
                      {t.TransactionType}
                    </span>
                  </div>

                  <div
                    className={`text-base font-bold tabular whitespace-nowrap ${
                      t.TransactionType === "Revenue" ? "text-revenue" : "text-expense"
                    }`}
                  >
                    {t.TransactionType === "Revenue" ? "+" : "−"}
                    {formatAmount(t.Amount)}
                  </div>
                </div>

                {/* Vendor & Category Head */}
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="font-semibold text-sm text-ink">{t.Vendor}</h4>
                  <span className="rounded bg-bg px-2 py-0.5 text-[11px] font-medium text-muted border border-border shrink-0">
                    {t.TransactionHead}
                  </span>
                </div>

                {/* Description & Creator */}
                <div>
                  <p className="text-xs text-ink/90 leading-snug">{t.Description}</p>
                  <p className="text-[10px] text-muted mt-0.5">by {t.CreatedByName || t.CreatedBy}</p>
                </div>

                {/* Rejection Note if Rejected */}
                {t.RejectionReason && (
                  <div className="flex items-start gap-1.5 rounded-md border border-rose-200 bg-rose-50/90 px-2.5 py-1.5 text-xs text-rose-800">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="leading-tight">
                      <span className="font-semibold text-rose-900">Rejection Note:</span>{" "}
                      <span>{t.RejectionReason}</span>
                    </div>
                  </div>
                )}

                {/* Footer Actions Row */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div>
                    {t.ReceiptURL ? (
                      <button
                        onClick={() => setSelectedReceipt(t)}
                        className="inline-flex items-center gap-1 rounded-card border border-border px-2.5 py-1 text-xs font-medium text-accent-dark hover:bg-accent/10 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Receipt
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted/60">—</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {role === "Accountant" && isCreator && isPending && onEdit && (
                      <button
                        onClick={() => onEdit(t)}
                        className="inline-flex items-center gap-1 rounded-card border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-bg"
                      >
                        <Edit2 className="h-3 w-3 text-muted" />
                        Edit
                      </button>
                    )}

                    {role === "Manager" && isPending && (
                      <>
                        {onApprove && (
                          <button
                            onClick={() => onApprove(t)}
                            className="inline-flex items-center gap-1 rounded-card bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </button>
                        )}
                        {onReject && (
                          <button
                            onClick={() => setRejectingTxn(t)}
                            className="inline-flex items-center gap-1 rounded-card border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        )}
                      </>
                    )}

                    {role === "Auditor" && (
                      <span className="text-xs text-muted">Audited</span>
                    )}

                    {isApproved && role !== "Auditor" && (
                      <span className="text-xs text-emerald-700 font-medium">Approved</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Ledger Table (screens >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-muted bg-surface/70">
                <th className="px-3.5 py-3 whitespace-nowrap">Date</th>
                <th className="px-3 py-3 whitespace-nowrap">Status</th>
                <th className="px-3 py-3 whitespace-nowrap">Type</th>
                <th className="px-3 py-3 whitespace-nowrap">Head</th>
                <th className="px-3.5 py-3 whitespace-nowrap">Vendor</th>
                <th className="px-3.5 py-3">Description</th>
                <th className="px-3.5 py-3 text-right whitespace-nowrap">Amount</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">Receipt</th>
                <th className="px-3.5 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedTransactions.map((t) => {
                const isCreator = user?.username === t.CreatedBy;
                const isPending = t.Status === "Pending";
                const isApproved = t.Status === "Approved";
                const isRejected = t.Status === "Rejected";

                return (
                  <tr
                    key={t.TransactionID}
                    className="border-b border-border last:border-0 hover:bg-bg/60 transition-colors"
                  >
                    <td className="whitespace-nowrap px-3.5 py-3 tabular text-ink font-medium">
                      {formatTransactionDate(t.TransactionDate)}
                    </td>

                    {/* Status Badge */}
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-800"
                            : isRejected
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isApproved && <CheckCircle2 className="h-3 w-3" />}
                        {isRejected && <XCircle className="h-3 w-3" />}
                        {isPending && <Clock className="h-3 w-3" />}
                        {t.Status}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.TransactionType === "Revenue"
                            ? "bg-revenue/10 text-revenue"
                            : "bg-expense/10 text-expense"
                        }`}
                      >
                        {t.TransactionType}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-ink text-xs">{t.TransactionHead}</td>
                    <td className="whitespace-nowrap px-3.5 py-3 text-ink font-medium">{t.Vendor}</td>
                    <td className="px-3.5 py-3 min-w-[160px] max-w-xs">
                      <p className="font-medium text-ink leading-snug">{t.Description}</p>
                      <p className="text-[11px] text-muted mt-0.5">by {t.CreatedByName || t.CreatedBy}</p>
                      {t.RejectionReason && (
                        <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-rose-200 bg-rose-50/90 px-2.5 py-1 text-xs text-rose-800 shadow-xs">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="leading-tight">
                            <span className="font-semibold text-rose-900">Rejection Note:</span>{" "}
                            <span>{t.RejectionReason}</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td
                      className={`whitespace-nowrap px-3.5 py-3 text-right tabular font-semibold ${
                        t.TransactionType === "Revenue" ? "text-revenue" : "text-expense"
                      }`}
                    >
                      {t.TransactionType === "Revenue" ? "+" : "−"}
                      {formatAmount(t.Amount)}
                    </td>

                    {/* Receipt Column */}
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      {t.ReceiptURL ? (
                        <button
                          onClick={() => setSelectedReceipt(t)}
                          title="View uploaded receipt"
                          className="inline-flex items-center gap-1 rounded-card border border-border px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent/10"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Receipt
                        </button>
                      ) : (
                        <span className="text-xs text-muted/60">—</span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="whitespace-nowrap px-3.5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Accountant Actions */}
                        {role === "Accountant" && isCreator && isPending && onEdit && (
                          <button
                            onClick={() => onEdit(t)}
                            className="inline-flex items-center gap-1 rounded-card border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-bg"
                          >
                            <Edit2 className="h-3 w-3 text-muted" />
                            Edit
                          </button>
                        )}

                        {/* Manager Review & Approval Actions */}
                        {role === "Manager" && isPending && (
                          <>
                            {onApprove && (
                              <button
                                onClick={() => onApprove(t)}
                                title="Approve Transaction"
                                className="inline-flex items-center gap-1 rounded-card bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </button>
                            )}
                            {onReject && (
                              <button
                                onClick={() => setRejectingTxn(t)}
                                title="Reject Transaction"
                                className="inline-flex items-center gap-1 rounded-card border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            )}
                          </>
                        )}

                        {/* Auditor / Read Only */}
                        {role === "Auditor" && (
                          <span className="text-xs text-muted">Audited</span>
                        )}

                        {/* Approved items notice */}
                        {isApproved && role !== "Auditor" && (
                          <span className="text-xs text-muted/70 font-normal">Approved</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      {showPagination && transactions.length > 0 && (
        <Pagination
          currentPage={validCurrentPage}
          totalItems={transactions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={pageSizeOptions}
          itemLabel="transactions"
        />
      )}
    </div>

      {/* Receipt Modal */}
      {selectedReceipt && selectedReceipt.ReceiptURL && (
        <ReceiptViewerModal
          receiptUrl={selectedReceipt.ReceiptURL}
          vendor={selectedReceipt.Vendor}
          amount={selectedReceipt.Amount}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Rejection Reason Modal */}
      {rejectingTxn && onReject && (
        <RejectModal
          transaction={rejectingTxn}
          onClose={() => setRejectingTxn(null)}
          onReject={async (reason) => {
            await onReject(rejectingTxn, reason);
          }}
        />
      )}
    </>
  );
}