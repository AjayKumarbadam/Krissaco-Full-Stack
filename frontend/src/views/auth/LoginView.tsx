import { FormEvent, useState } from "react";
import {
  Coffee,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface LoginViewProps {
  onToast: (variant: "success" | "error", text: string) => void;
}

export default function LoginView({ onToast }: LoginViewProps) {
  const { loginUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser(username.trim(), password);
      onToast("success", "Authentication successful. Welcome back.");
    } catch (err: any) {
      onToast("error", err.message || "Invalid work email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#faf8f5] antialiased">
      {/* Left Column: Brand Hero & Value Proposition (visible on lg+ screens) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#2c1810] via-[#3d2314] to-[#1f100a] p-12 text-white lg:flex">
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-600/15 blur-3xl" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white shadow-lg">
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Krissaco
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-widest text-amber-200/80">
              Coffee Enterprise
            </span>
          </div>
        </div>

        {/* Value Proposition & Compliance Highlights */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Controlled transaction processing with full audit traceability.
          </h1>
          <p className="text-sm leading-relaxed text-amber-100/70">
            A unified financial portal built for strict segregation of duties between accountants,
            operational managers, and compliance auditors.
          </p>

          <div className="space-y-3 pt-2 text-xs text-amber-100/80">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Three-tier Role-Based Access Control (Accountant, Manager, Auditor)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Immutable historical audit trail & digital receipt verification</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Approved-only financial statement generation & signed PDF exports</span>
            </div>
          </div>
        </div>

        {/* Empty placeholder spacer for layout balance */}
        <div className="relative z-10" />
      </div>

      {/* Right Column: Authentication Form */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-12 lg:w-1/2 lg:p-16">
        <div className="mx-auto flex w-full max-w-md flex-col justify-center flex-1">
          {/* Mobile Header (visible only on small screens) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-md">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-ink">Krissaco</span>
              <span className="block text-[10px] uppercase tracking-wider text-muted font-semibold">
                Financial Portal
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              Sign in to your account
            </h2>
            <p className="mt-1 text-sm text-muted">
              Enter your credentials to access the financial management system.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink/90">
                Work Email Address
              </label>
              <div className="relative mt-1">
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@krissaco.com"
                  className="w-full rounded-card border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 transition-all focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/15"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-ink/90">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-card border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 transition-all focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/15"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-ink select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span>Remember this device for 24 hours</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-card bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-accent-dark hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
            >
              {loading ? (
                <span>Verifying credentials…</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
