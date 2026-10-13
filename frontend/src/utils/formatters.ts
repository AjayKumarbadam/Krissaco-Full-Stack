// Shared formatting helpers. Keep number/date display consistent app-wide.

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatAmount(amount: number): string {
  return currencyFormatter.format(amount);
}

// Backend dates are already "DD-MM-YYYY" strings — display as-is,
// just normalize separators in case of stray whitespace.
export function formatTransactionDate(date: string): string {
  return date.trim();
}

// Convert a JS Date to the "DD-MM-YYYY" format the backend expects.
export function toBackendDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// CreatedAt is ISO — format for display when needed.
export function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initialsFrom(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}
