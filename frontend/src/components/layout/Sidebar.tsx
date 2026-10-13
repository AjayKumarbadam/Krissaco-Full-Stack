import { Receipt, FileBarChart, History, LogOut, Shield, UserCheck, Eye, Coffee } from "lucide-react";
import NavButton from "./NavButton";
import Avatar from "../common/Avatar";
import type { View } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  view: View;
  onNavigate: (view: View) => void;
}

export default function Sidebar({ view, onNavigate }: SidebarProps) {
  const { user, role, logoutUser } = useAuth();

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-sm">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-base font-bold text-ink">Krissaco</span>
            <span className="block text-[10px] uppercase tracking-wider text-muted font-semibold">Coffee Finance</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          <NavButton
            label={role === "Manager" ? "Approvals & Txns" : "Transactions"}
            icon={<Receipt className="h-4 w-4" />}
            active={view === "transactions"}
            onClick={() => onNavigate("transactions")}
          />
          <NavButton
            label="Statement & PDF"
            icon={<FileBarChart className="h-4 w-4" />}
            active={view === "statement"}
            onClick={() => onNavigate("statement")}
          />
          {(role === "Auditor" || role === "Manager") && (
            <NavButton
              label="Audit Logs"
              icon={<History className="h-4 w-4" />}
              active={view === "audit-logs"}
              onClick={() => onNavigate("audit-logs")}
            />
          )}
        </nav>
      </div>

      {/* User Session & Sign Out Footer */}
      {user && (
        <div className="border-t border-border pt-4">
          <div className="rounded-card border border-border bg-bg/60 p-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Avatar label={user.full_name || user.username} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink leading-tight">
                  {user.full_name}
                </p>
                <span
                  className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    role === "Manager"
                      ? "bg-emerald-100 text-emerald-800"
                      : role === "Auditor"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {role === "Manager" && <Shield className="h-2.5 w-2.5" />}
                  {role === "Auditor" && <Eye className="h-2.5 w-2.5" />}
                  {role === "Accountant" && <UserCheck className="h-2.5 w-2.5" />}
                  {role}
                </span>
              </div>
            </div>

            <button
              onClick={logoutUser}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
