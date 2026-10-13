import { useCallback, useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import ToastStack from "./components/common/Toast";
import TransactionsView from "./views/transactions/TransactionsView";
import StatementView from "./views/statement/StatementView";
import AuditLogsView from "./views/audit/AuditLogsView";
import LoginView from "./views/auth/LoginView";
import { AuthProvider, useAuth } from "./context/AuthContext";
import type { ToastMessage, View } from "./types";

function MainContent({
  onToast,
}: {
  onToast: (variant: "success" | "error", text: string) => void;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [view, setView] = useState<View>("transactions");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">
        Loading Krissaco system…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onToast={onToast} />;
  }

  return (
    <AppLayout view={view} onNavigate={setView}>
      {view === "transactions" && <TransactionsView onToast={onToast} />}
      {view === "statement" && <StatementView onToast={onToast} />}
      {view === "audit-logs" && <AuditLogsView onToast={onToast} />}
    </AppLayout>
  );
}

export default function App() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((variant: "success" | "error", text: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, variant, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AuthProvider>
      <MainContent onToast={showToast} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AuthProvider>
  );
}
