import { FormEvent, useState } from "react";
import { X, Upload, FileCheck } from "lucide-react";
import FormField from "../common/FormField";
import FormSelect from "../common/FormSelect";
import ActionButton from "../common/ActionButton";
import { createTransaction, updateTransaction, uploadReceipt } from "../../api/transactions";
import { toBackendDate } from "../../utils/formatters";
import { ApiError } from "../../api/client";
import { TRANSACTION_HEADS } from "../../constants";
import type { Transaction, TransactionHead, TransactionType } from "../../types";

interface TransactionModalProps {
  initialTransaction?: Transaction | null;
  onClose: () => void;
  onSaved: (transaction: Transaction, isNew: boolean) => void;
  onError: (message: string) => void;
}

interface FormState {
  date: string;
  type: TransactionType | "";
  head: TransactionHead | "";
  amount: string;
  vendor: string;
  description: string;
  remarks: string;
}

export default function TransactionModal({
  initialTransaction,
  onClose,
  onSaved,
  onError,
}: TransactionModalProps) {
  const isEditing = !!initialTransaction;

  const [form, setForm] = useState<FormState>({
    date: initialTransaction?.TransactionDate || toBackendDate(new Date()),
    type: initialTransaction?.TransactionType || "",
    head: initialTransaction?.TransactionHead || "",
    amount: initialTransaction ? String(initialTransaction.Amount) : "",
    vendor: initialTransaction?.Vendor || "",
    description: initialTransaction?.Description || "",
    remarks: initialTransaction?.Remarks || "",
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.type) next.type = "Select a transaction type";
    if (!form.head) next.head = "Select a transaction head";
    if (!form.amount || Number(form.amount) <= 0) next.amount = "Enter an amount greater than 0";
    if (form.vendor.trim().length < 2) next.vendor = "Vendor must be at least 2 characters";
    if (form.description.trim().length < 3) next.description = "Description must be at least 3 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      let savedRecord: Transaction;

      if (isEditing && initialTransaction) {
        savedRecord = await updateTransaction(initialTransaction.TransactionID, {
          TransactionDate: form.date,
          TransactionType: form.type as TransactionType,
          TransactionHead: form.head as TransactionHead,
          Amount: Number(form.amount),
          Vendor: form.vendor.trim(),
          Description: form.description.trim(),
          Remarks: form.remarks.trim() || undefined,
        });
      } else {
        savedRecord = await createTransaction({
          TransactionDate: form.date,
          TransactionType: form.type as TransactionType,
          TransactionHead: form.head as TransactionHead,
          Amount: Number(form.amount),
          Vendor: form.vendor.trim(),
          Description: form.description.trim(),
          Remarks: form.remarks.trim() || undefined,
        });
      }

      // If user uploaded a receipt file, attach it
      if (receiptFile) {
        try {
          savedRecord = await uploadReceipt(savedRecord.TransactionID, receiptFile);
        } catch {
          onError("Transaction saved, but receipt upload failed.");
        }
      }

      onSaved(savedRecord, !isEditing);
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save transaction.";
      onError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-lg flex-col rounded-card bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              {isEditing ? "Edit Pending Transaction" : "Record Transaction"}
            </h2>
            <p className="text-xs text-muted">
              {isEditing
                ? "Update your pending transaction details"
                : "Enter transaction details for manager approval review"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-card p-1 text-muted hover:bg-bg hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            <FormField
              id="date"
              label="Transaction Date (DD-MM-YYYY)"
              value={form.date}
              error={errors.date}
              placeholder="e.g. 09-10-2026"
              onChange={(e) => update("date", e.target.value)}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormSelect
                id="type"
                label="Type"
                value={form.type}
                error={errors.type}
                options={["Revenue", "Expense"]}
                onChange={(e) => update("type", e.target.value as TransactionType)}
              />

              <FormSelect
                id="head"
                label="Head"
                value={form.head}
                error={errors.head}
                options={TRANSACTION_HEADS}
                onChange={(e) => update("head", e.target.value as TransactionHead)}
              />
            </div>

            <FormField
              id="amount"
              label="Amount (₹)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              error={errors.amount}
              onChange={(e) => update("amount", e.target.value)}
            />

            <FormField
              id="vendor"
              label="Vendor / Counterparty"
              placeholder="e.g. Coorg Coffee Traders"
              value={form.vendor}
              error={errors.vendor}
              onChange={(e) => update("vendor", e.target.value)}
            />

            <FormField
              id="description"
              label="Description"
              placeholder="e.g. Fresh Arabica beans batch #441"
              value={form.description}
              error={errors.description}
              onChange={(e) => update("description", e.target.value)}
            />

            <FormField
              id="remarks"
              label="Remarks (Optional)"
              placeholder="Any additional notes or invoice numbers"
              value={form.remarks}
              onChange={(e) => update("remarks", e.target.value)}
            />

            {/* Receipt Upload Section */}
            <div className="rounded-card border border-dashed border-border bg-bg/40 p-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center">
                {receiptFile ? (
                  <div className="flex items-center gap-2 text-accent-dark">
                    <FileCheck className="h-5 w-5 text-revenue" />
                    <span className="text-sm font-medium">{receiptFile.name}</span>
                  </div>
                ) : initialTransaction?.ReceiptURL ? (
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <FileCheck className="h-4 w-4 text-revenue" />
                    <span>Current receipt attached. Click below to replace.</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted" />
                    <span className="text-xs font-medium text-ink">
                      Attach supporting receipt (JPG, PNG, PDF)
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReceiptFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-card border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-bg"
            >
              Cancel
            </button>
            <ActionButton type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEditing ? "Update Transaction" : "Record Transaction"}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
