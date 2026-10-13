import { Menu, Receipt, FileBarChart, History, LogOut } from "lucide-react";
import type { View } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  view: View;
  onOpenSidebar: () => void;
}

const titles: Record<View, string> = {
  transactions: "Transactions & Approvals",
  statement: "Financial Statement",
  "audit-logs": "Audit Trail & Logs",
};

export default function Header({ view, onOpenSidebar }: HeaderProps) {
  const { user, role, logoutUser } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="rounded-card p-1.5 text-ink hover:bg-ink/5"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-1.5 font-display text-sm font-semibold text-ink">
          {view === "transactions" && <Receipt className="h-4 w-4 text-accent" />}
          {view === "statement" && <FileBarChart className="h-4 w-4 text-accent" />}
          {view === "audit-logs" && <History className="h-4 w-4 text-accent" />}
          {titles[view]}
        </span>
      </div>

      {user && (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent-dark">
            {role}
          </span>
          <button
            onClick={logoutUser}
            className="rounded p-1 text-muted hover:text-rose-600"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </header>
  );
}
