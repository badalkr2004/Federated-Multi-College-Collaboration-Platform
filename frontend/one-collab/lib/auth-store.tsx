"use client";
// Zustand-free lightweight store using React context + localStorage
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User, TenantId } from "./types";

export interface AuthState {
  token: string | null;
  user: User | null;
  tenantId: TenantId | null;
  adminToken: string | null;
}

export interface AuthStore extends AuthState {
  setTenantAuth: (token: string, user: User, tenantId: TenantId) => void;
  setAdminToken: (token: string) => void;
  logout: () => void;
  logoutAdmin: () => void;
}

const STORAGE_KEY = "collabhub_auth";
const ADMIN_STORAGE_KEY = "collabhub_admin";

const AuthContext = createContext<AuthStore | null>(null);

function loadFromStorage(): Partial<AuthState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const adminToken = localStorage.getItem(ADMIN_STORAGE_KEY);
    const state = raw ? JSON.parse(raw) : {};
    return { ...state, adminToken };
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    tenantId: null,
    adminToken: null,
  });

  useEffect(() => {
    const stored = loadFromStorage();
    setState((s) => ({ ...s, ...stored }));
  }, []);

  const setTenantAuth = (token: string, user: User, tenantId: TenantId) => {
    const next = { token, user, tenantId };
    setState((s) => ({ ...s, ...next }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setAdminToken = (adminToken: string) => {
    setState((s) => ({ ...s, adminToken }));
    localStorage.setItem(ADMIN_STORAGE_KEY, adminToken);
  };

  const logout = () => {
    setState((s) => ({ ...s, token: null, user: null, tenantId: null }));
    localStorage.removeItem(STORAGE_KEY);
  };

  const logoutAdmin = () => {
    setState((s) => ({ ...s, adminToken: null }));
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ ...state, setTenantAuth, setAdminToken, logout, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthStore {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
