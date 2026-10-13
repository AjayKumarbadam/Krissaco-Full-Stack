import { ReactNode } from "react";

interface NavButtonProps {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}

export default function NavButton({ label, icon, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center gap-3 rounded-card px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-accent/10 text-accent-dark"
          : "text-ink/70 hover:bg-ink/5 hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
