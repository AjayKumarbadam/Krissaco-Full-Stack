import { FormEvent, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import type { Transaction } from "../../types";

interface RejectModalProps {
  transaction: Transaction;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
}

export default function RejectModal({
  transaction,
  onClose,
  onReject,
}: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onReject(reason.trim() || "Information or receipts require revision");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-card bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-expense">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-ink">Reject Transaction</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-card p-1.5 text-muted hover:bg-bg hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="rounded-card bg-bg/50 p-3 text-xs text-muted">
            <span className="font-semibold text-ink">{transaction.Vendor}</span> &bull; ₹
            {transaction.Amount.toLocaleString()} &bull; {transaction.Description}
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Rejection Reason (Optional)</span>
            <textarea
              rows={3}
              placeholder="e.g. Please attach official GST receipt or correct vendor name."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-card border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-bg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-card bg-expense px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Rejecting…" : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
