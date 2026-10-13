import { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormField({ label, error, id, className = "", ...rest }: FormFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        id={id}
        className={`w-full rounded-card border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted ${
          error ? "border-expense" : "border-border"
        } ${className}`}
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-expense">{error}</span>}
    </label>
  );
}
