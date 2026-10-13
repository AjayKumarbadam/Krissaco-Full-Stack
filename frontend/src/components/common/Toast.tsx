import { CheckCircle2, XCircle, X } from "lucide-react";
import type { ToastMessage } from "../../types";

interface ToastStackProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

// Fixed stack of transient notifications. Surfaces both success messages
// (e.g. "Transaction recorded") and backend error messages (ApiError.message)
// so failures are never silent.
export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`animate-fade-in flex items-start gap-2 rounded-card border px-4 py-3 text-sm shadow-sm ${
            toast.variant === "success"
              ? "border-revenue/30 bg-surface text-ink"
              : "border-expense/30 bg-surface text-ink"
          }`}
        >
          {toast.variant === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-revenue" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-expense" />
          )}
          <span className="flex-1">{toast.text}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
            className="text-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
