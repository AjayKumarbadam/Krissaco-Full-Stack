import { X, ExternalLink, Download, FileText } from "lucide-react";

interface ReceiptViewerModalProps {
  receiptUrl: string;
  vendor: string;
  amount: number;
  onClose: () => void;
}

const BACKEND_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function ReceiptViewerModal({
  receiptUrl,
  vendor,
  amount,
  onClose,
}: ReceiptViewerModalProps) {
  const fullUrl = receiptUrl.startsWith("http")
    ? receiptUrl
    : `${BACKEND_BASE.replace(/\/$/, "")}${receiptUrl}`;

  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(receiptUrl);
  const isPdf = /\.pdf$/i.test(receiptUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-card bg-surface shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border px-4 py-3 sm:px-6 sm:py-4 bg-surface">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-ink font-display">Attached Receipt & Invoice</h2>
            <p className="text-xs text-muted">
              {vendor} &bull; <span className="font-semibold text-ink">INR {amount.toLocaleString()}</span>
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-card border border-border px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-bg transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted" />
              <span className="hidden sm:inline">Open in New Tab</span>
              <span className="sm:hidden">Open</span>
            </a>
            <a
              href={fullUrl}
              download
              className="flex items-center gap-1.5 rounded-card bg-accent px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className="rounded-card p-1.5 text-muted hover:bg-bg hover:text-ink transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Embedded Preview */}
        <div className="flex flex-1 items-center justify-center overflow-hidden bg-bg/50 p-4">
          {isPdf ? (
            <iframe
              src={fullUrl}
              title="Receipt PDF Preview"
              className="h-full w-full rounded-md border border-border bg-white shadow-sm"
            />
          ) : isImage ? (
            <div className="flex h-full w-full items-center justify-center overflow-auto">
              <img
                src={fullUrl}
                alt="Receipt"
                className="max-h-full max-w-full rounded-md border border-border object-contain shadow-md"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold text-ink">Receipt Document File</p>
                <p className="text-xs text-muted font-mono mt-0.5">{receiptUrl.split("/").pop()}</p>
              </div>
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-card bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-dark shadow-sm"
              >
                View Document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
