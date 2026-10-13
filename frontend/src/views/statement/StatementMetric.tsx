import { ReactNode } from "react";
import { formatAmount } from "../../utils/formatters";

interface StatementMetricProps {
  label: string;
  value: number;
  tone: "revenue" | "expense" | "neutral";
  icon: ReactNode;
}

// Values come directly from GET /statement response fields.
// No mock/placeholder values — zero is a valid, honest state.
export default function StatementMetric({ label, value, tone, icon }: StatementMetricProps) {
  const toneClass =
    tone === "revenue" ? "text-revenue" : tone === "expense" ? "text-expense" : "text-ink";

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted">
        {icon}
        {label}
      </div>
      <p className={`font-display tabular text-2xl font-medium ${toneClass}`}>
        {formatAmount(value)}
      </p>
    </div>
  );
}
