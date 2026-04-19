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
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { setTenantAuth } = useAuth();

  const [tenantId, setTenantId] = useState<TenantId>("a");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await authApi.register(tenantId, name, email, password);
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? "Registration failed");
      return;
    }
    setTenantAuth(res.data.token, res.data.user as never, tenantId);
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 dark:bg-black">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/5" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/5" />
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
          <h1 className="text-3xl font-bold">Create account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Join the cross-college collaboration network
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-black/10 bg-card p-8 shadow-sm dark:border-white/10">
          <form onSubmit={handleSubmit} id="register-form" className="space-y-5">
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
              <Label htmlFor="name-input">Full Name</Label>
              <Input
                id="name-input"
                type="text"
                placeholder="Alice Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
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
                  autoComplete="new-password"
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
              <p className="text-xs text-muted-foreground">Min 8 chars, must include uppercase, number, and symbol</p>
            </div>

            {error && (
              <div
                id="register-error"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
              >
                {error}
              </div>
            )}

            <Button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full rounded-xl"
            >
              {loading ? "Creating account…" : "Create account"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              id="go-to-login"
              className="font-medium text-foreground hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Email domain hint */}
        <div className="mt-4 rounded-xl border border-black/10 bg-secondary/40 p-3 text-xs text-muted-foreground dark:border-white/10">
          <strong>Email domain must match your college:</strong>{" "}
          {tenantId === "a" ? "@a.ac.in (College A)" : "@b.ac.in (College B)"}
        </div>
      </div>
    </div>
  );
}
