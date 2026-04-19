"use client";

import { useAuth } from "@/lib/auth-store";
import { TENANTS } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  FolderOpen,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppNav() {
  const { user, tenantId, token, adminToken, logout, logoutAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const tenant = tenantId ? TENANTS[tenantId] : null;
  const tenantColor =
    tenant?.color === "violet"
      ? "bg-violet-600"
      : tenant?.color === "cyan"
      ? "bg-cyan-600"
      : "bg-zinc-800";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function handleAdminLogout() {
    logoutAdmin();
    router.push("/admin");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-black/70">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href={token ? "/dashboard" : adminToken ? "/admin" : "/"} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-sm font-bold text-white dark:bg-white dark:text-black">
            OC
          </span>
          <span className="font-semibold">One Collab</span>
          {tenant && (
            <span
              className={cn(
                "hidden rounded-md px-2 py-0.5 text-xs font-medium text-white sm:inline-flex",
                tenantColor
              )}
            >
              {tenant.name}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        {token && (
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        )}

        {adminToken && !token && (
          <div className="hidden items-center gap-1 md:flex">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/admin"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {token && user && (
            <>
              <div className="hidden items-center gap-3 md:flex">
                <div className="text-right">
                  <p className="text-xs font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <button
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary dark:border-white/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
              {/* Mobile menu toggle */}
              <button
                id="mobile-menu-toggle"
                className="rounded-lg p-1.5 md:hidden"
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          )}

          {adminToken && !token && (
            <button
              id="admin-logout-btn"
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary dark:border-white/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              Admin sign out
            </button>
          )}

          {!token && !adminToken && (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                id="nav-login-link"
                className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary dark:border-white/10"
              >
                Sign in
              </Link>
              <Link
                href="/admin"
                id="nav-admin-link"
                className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Admin
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && token && (
        <div className="border-t border-black/10 bg-white pb-4 dark:border-white/10 dark:bg-black md:hidden">
          <div className="px-4 pt-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <hr className="my-2 border-black/10 dark:border-white/10" />
            {user && (
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}
            <button
              onClick={() => { setMobileOpen(false); handleLogout(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
