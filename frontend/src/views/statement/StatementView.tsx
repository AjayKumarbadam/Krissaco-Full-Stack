import { FormEvent, useState } from "react";
import { TrendingUp, TrendingDown, Scale, Download, ShieldCheck } from "lucide-react";
import PageHeading from "../../components/common/PageHeading";
import ActionButton from "../../components/common/ActionButton";
import TransactionTable from "../../components/tables/TransactionTable";
import StatementMetric from "./StatementMetric";
import { getStatement, downloadStatementPdf } from "../../api/statement";
import { ApiError } from "../../api/client";
import { toBackendDate } from "../../utils/formatters";
import type { StatementResponse } from "../../types";

interface StatementViewProps {
  onToast: (variant: "success" | "error", text: string) => void;
}

function toInputDate(backendDate: string): string {
  const [d, m, y] = backendDate.split("-");
  return `${y}-${m}-${d}`;
}

function toBackendFromInput(inputDate: string): string {
  const [y, m, d] = inputDate.split("-");
  return `${d}-${m}-${y}`;
}

export default function StatementView({ onToast }: StatementViewProps) {
  const today = toBackendDate(new Date());
  const thirtyDaysAgo = toBackendDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [result, setResult] = useState<StatementResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await getStatement(startDate, endDate);
      setResult(res);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not load the statement.";
      onToast("error", message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExportPdf() {
    setIsExportingPdf(true);
    try {
      await downloadStatementPdf(startDate, endDate);
      onToast("success", "Statement PDF downloaded successfully.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not export PDF.";
      onToast("error", message);
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div>
      <PageHeading
        title="Financial Statement"
        description="Official revenue, expense, and net totals from approved transactions."
        action={
          hasSearched && result && result.count > 0 ? (
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-dark disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              {isExportingPdf ? "Exporting PDF…" : "Export Official PDF"}
            </button>
          ) : undefined
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-card border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
        <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
        <span>
          <b>Approved Records Only:</b> In accordance with Krissaco SRS v2.0, non-approved and rejected entries are strictly excluded from statements and financial totals.
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col sm:flex-row sm:items-end gap-3 rounded-card border border-border bg-surface p-4"
      >
        <label className="flex flex-col gap-1.5 text-sm flex-1">
          <span className="font-medium text-ink">Start date</span>
          <input
            type="date"
            value={toInputDate(startDate)}
            max={toInputDate(endDate)}
            onChange={(e) => setStartDate(toBackendFromInput(e.target.value))}
            className="w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm flex-1">
          <span className="font-medium text-ink">End date</span>
          <input
            type="date"
            value={toInputDate(endDate)}
            min={toInputDate(startDate)}
            onChange={(e) => setEndDate(toBackendFromInput(e.target.value))}
            className="w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink"
          />
        </label>
        <div className="w-full sm:w-auto">
          <ActionButton type="submit" disabled={isLoading} className="w-full sm:w-auto justify-center">
            {isLoading ? "Running…" : "Run statement"}
          </ActionButton>
        </div>
      </form>

      {hasSearched && result && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatementMetric
            label="Total Approved Revenue"
            value={result.total_revenue}
            tone="revenue"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatementMetric
            label="Total Approved Expense"
            value={result.total_expense}
            tone="expense"
            icon={<TrendingDown className="h-4 w-4" />}
          />
          <StatementMetric
            label="Net Profit / (Loss)"
            value={result.net}
            tone={result.net >= 0 ? "revenue" : "expense"}
            icon={<Scale className="h-4 w-4" />}
          />
        </div>
      )}

      {hasSearched ? (
        <TransactionTable transactions={result?.transactions ?? []} isLoading={isLoading} />
      ) : (
        <div className="rounded-card border border-dashed border-border bg-surface py-16 text-center text-sm text-muted">
          Choose a date range and run the statement to view approved entries.
        </div>
      )}
    </div>
  );
}
