import { ButtonHTMLAttributes, ReactNode } from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: "primary" | "secondary";
}

export default function ActionButton({
  icon,
  variant = "primary",
  className = "",
  children,
  ...rest
}: ActionButtonProps) {
  const base =
    "inline-flex items-center gap-2 rounded-card px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-dark",
    secondary: "bg-surface text-ink border border-border hover:bg-bg",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}
