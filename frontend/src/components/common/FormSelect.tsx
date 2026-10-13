import { SelectHTMLAttributes } from "react";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly string[];
  error?: string;
}

export default function FormSelect({
  label,
  options,
  error,
  id,
  className = "",
  ...rest
}: FormSelectProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <select
        id={id}
        className={`w-full rounded-card border bg-surface px-3 py-2 text-sm text-ink ${
          error ? "border-expense" : "border-border"
        } ${className}`}
        {...rest}
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-expense">{error}</span>}
    </label>
  );
}
