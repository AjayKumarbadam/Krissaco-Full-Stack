import { ReactNode, useState } from "react";
import { X } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import type { View } from "../../types";

interface AppLayoutProps {
  view: View;
  onNavigate: (view: View) => void;
  children: ReactNode;
}

// Page shell: sidebar (desktop) + header/drawer (mobile) + content slot.
export default function AppLayout({ view, onNavigate, children }: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-surface px-4 py-6 md:flex overflow-y-auto">
        <Sidebar view={view} onNavigate={onNavigate} />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-50 h-full w-64 bg-surface px-4 py-6 shadow-lg">
            <button
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="mb-6 rounded-card p-1.5 text-ink hover:bg-ink/5"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar
              view={view}
              onNavigate={(v) => {
                onNavigate(v);
                setMobileNavOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header view={view} onOpenSidebar={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
