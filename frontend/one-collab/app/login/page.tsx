"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { authApi } from "@/lib/api";
import { TENANTS, type TenantId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { setTenantAuth } = useAuth();

  const [tenantId, setTenantId] = useState<TenantId>("a");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickFill = [
    { label: "Alice (A)", email: "alice@a.ac.in", tenant: "a" as TenantId },
    { label: "Bob (A)", email: "bob@a.ac.in", tenant: "a" as TenantId },
    { label: "Dave (B)", email: "dave@b.ac.in", tenant: "b" as TenantId },
    { label: "Eve (B)", email: "eve@b.ac.in", tenant: "b" as TenantId },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await authApi.login(tenantId, email, password);
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? "Login failed");
      return;
    }
    setTenantAuth(res.data.token, res.data.user as never, tenantId);
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 dark:bg-black">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/5" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/5" />
      </div>

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-bold text-white dark:bg-white dark:text-black">
              OC
            </span>
            <span className="text-lg font-semibold">One Collab</span>
          </Link>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your college credentials
          </p>
        </div>

        {/* Quick fill */}
        <div className="mb-6 rounded-xl border border-black/10 bg-secondary/40 p-3 dark:border-white/10">
          <p className="mb-2.5 text-xs font-medium text-muted-foreground">Quick fill (demo)</p>
          <div className="flex flex-wrap gap-2">
            {quickFill.map((q) => (
              <button
                key={q.email}
                id={`quick-fill-${q.label.replace(/\s+/g, "-").toLowerCase()}`}
                type="button"
                onClick={() => { setEmail(q.email); setPassword("Pass1234!"); setTenantId(q.tenant); }}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  q.tenant === "a"
                    ? "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300"
                    : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300"
                )}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-black/10 bg-card p-8 shadow-sm dark:border-white/10">
          <form onSubmit={handleSubmit} id="login-form" className="space-y-5">
            {/* Tenant selector */}
            <div className="space-y-2">
              <Label htmlFor="tenant-select">College</Label>
              <Select
                id="tenant-select"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value as TenantId)}
              >
                {Object.values(TENANTS).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.host}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-input">Email</Label>
              <Input
                id="email-input"
                type="email"
                placeholder="alice@a.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-input">Password</Label>
              <div className="relative">
                <Input
                  id="password-input"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                id="login-error"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
              >
                {error}
              </div>
            )}

            <Button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full rounded-xl"
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              id="go-to-register"
              className="font-medium text-foreground hover:underline"
            >
              Register
            </Link>
          </p>
        </div>

        {/* Admin link */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          <Link href="/admin" id="go-to-admin" className="hover:text-foreground hover:underline">
            Super Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
