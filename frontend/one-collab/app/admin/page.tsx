"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-store";
import { adminApi, onboardingApi } from "@/lib/api";
import type { CollegeRequest, College } from "@/lib/types";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  ClipboardList,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "requests" | "colleges" | "onboarding";

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300",
  rejected: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
};

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("superadmin@platform.ac.in");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await adminApi.login(email, password);
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? "Login failed");
      return;
    }
    onLogin(res.data.token);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Super Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform administration portal
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-card p-6 shadow-sm dark:border-white/10">
          <form id="admin-login-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email-input">Email</Label>
              <Input
                id="admin-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password-input">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password-input"
                  type={showPw ? "text" : "password"}
                  placeholder="SuperSecurePass123!"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              <p className="text-xs text-muted-foreground">
                Demo: SuperSecurePass123!
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full rounded-xl"
            >
              {loading ? "Signing in…" : "Sign in as Admin"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function OnboardingTab() {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollId, setPollId] = useState("");
  const [pollResult, setPollResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await onboardingApi.submit({ name, domain, emailDomain, contactName, contactEmail });
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? "Submission failed");
      return;
    }
    setResult(res.data);
    setPollId(res.data.id);
  }

  async function handlePoll() {
    if (!pollId) return;
    const res = await onboardingApi.getStatus(pollId);
    if (res.success && res.data) {
      setPollResult(`Status: ${res.data.status}${res.data.rejectionReason ? ` — ${res.data.rejectionReason}` : ""}`);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-black/10 bg-card p-6 shadow-sm dark:border-white/10">
        <h2 className="mb-5 font-semibold">Submit Onboarding Request</h2>
        {result ? (
          <div className="text-center py-6">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
            <p className="font-medium">Request submitted!</p>
            <p className="mt-1 text-sm text-muted-foreground">ID: {result.id}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Status: {result.status}</p>
            <Button onClick={() => setResult(null)} variant="outline" className="mt-4 rounded-xl">
              Submit another
            </Button>
          </div>
        ) : (
          <form id="onboarding-form" onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: "ob-name", label: "College Name", value: name, set: setName, placeholder: "College C" },
              { id: "ob-domain", label: "Domain", value: domain, set: setDomain, placeholder: "projects.c.localhost" },
              { id: "ob-email-domain", label: "Email Domain", value: emailDomain, set: setEmailDomain, placeholder: "@c.ac.in" },
              { id: "ob-contact-name", label: "Contact Name", value: contactName, set: setContactName, placeholder: "Dr. Smith" },
              { id: "ob-contact-email", label: "Contact Email", value: contactEmail, set: setContactEmail, placeholder: "smith@c.ac.in" },
            ].map(({ id, label, value, set, placeholder }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={id}>{label}</Label>
                <Input id={id} value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} required />
              </div>
            ))}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <Button id="onboarding-submit-btn" type="submit" disabled={loading} className="w-full rounded-xl">
              {loading ? "Submitting…" : <><Plus className="mr-2 h-4 w-4" />Submit Request</>}
            </Button>
          </form>
        )}
      </div>

      <div className="rounded-2xl border border-black/10 bg-card p-6 shadow-sm dark:border-white/10">
        <h2 className="mb-5 font-semibold">Poll Request Status</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="poll-request-id">Request ID</Label>
            <Input
              id="poll-request-id"
              value={pollId}
              onChange={(e) => setPollId(e.target.value)}
              placeholder="db42ad1a-4d17-..."
            />
          </div>
          <Button id="poll-status-btn" onClick={handlePoll} variant="outline" className="rounded-xl">
            Check Status
          </Button>
          {pollResult && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300">
              {pollResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { adminToken, setAdminToken } = useAuth();
  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<CollegeRequest[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  function showMsg(msg: string) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 4000);
  }

  const fetchRequests = useCallback(async () => {
    if (!adminToken) return;
    setLoadingRequests(true);
    const res = await adminApi.listRequests(adminToken);
    setLoadingRequests(false);
    if (res.success && res.data) setRequests(res.data as CollegeRequest[]);
  }, [adminToken]);

  const fetchColleges = useCallback(async () => {
    if (!adminToken) return;
    setLoadingColleges(true);
    const res = await adminApi.listColleges(adminToken);
    setLoadingColleges(false);
    if (res.success && res.data) setColleges(res.data as College[]);
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) {
      fetchRequests();
      fetchColleges();
    }
  }, [adminToken, fetchRequests, fetchColleges]);

  async function handleApprove(id: string) {
    if (!adminToken) return;
    const res = await adminApi.approveRequest(adminToken, id);
    if (res.success) {
      showMsg("College approved and provisioned!");
      fetchRequests();
      fetchColleges();
    } else {
      showMsg(res.error?.message ?? "Failed to approve");
    }
  }

  async function handleReject(id: string) {
    if (!adminToken || !rejectReason.trim()) return;
    const res = await adminApi.rejectRequest(adminToken, id, rejectReason);
    if (res.success) {
      showMsg("Request rejected.");
      setRejectId(null);
      setRejectReason("");
      fetchRequests();
    } else {
      showMsg(res.error?.message ?? "Failed to reject");
    }
  }

  async function handleDeactivate(id: string) {
    if (!adminToken) return;
    const res = await adminApi.deactivateCollege(adminToken, id);
    if (res.success) {
      showMsg("College deactivated.");
      fetchColleges();
    } else {
      showMsg(res.error?.message ?? "Failed to deactivate");
    }
  }

  if (!adminToken) {
    return <AdminLogin onLogin={(t) => setAdminToken(t)} />;
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "requests", label: "Requests", icon: <ClipboardList className="h-4 w-4" /> },
    { key: "colleges", label: "Colleges", icon: <Building2 className="h-4 w-4" /> },
    { key: "onboarding", label: "Onboarding", icon: <Plus className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Super Admin Portal</h1>
            <p className="text-sm text-muted-foreground">Manage colleges and onboarding</p>
          </div>
        </div>

        {actionMsg && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
            {actionMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-black/10 bg-secondary/40 p-1 dark:border-white/10">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              id={`admin-tab-${key}`}
              onClick={() => setTab(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                tab === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "requests" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">College Onboarding Requests</h2>
              <button
                id="refresh-requests-btn"
                onClick={fetchRequests}
                className="flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-secondary dark:border-white/10"
              >
                <RefreshCw className={cn("h-3 w-3", loadingRequests && "animate-spin")} />
                Refresh
              </button>
            </div>
            {loadingRequests ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-black/10 bg-card p-5 dark:border-white/10">
                    <div className="h-5 w-1/3 rounded bg-secondary" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-secondary" />
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/20 p-12 text-center dark:border-white/20">
                <ClipboardList className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No onboarding requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-black/10 bg-card p-5 shadow-sm dark:border-white/10"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{req.name}</h3>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                              STATUS_STYLES[req.status] ?? "border-secondary bg-secondary"
                            )}
                          >
                            {req.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{req.domain}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.contactName} · {req.contactEmail}
                        </p>
                        {req.rejectionReason && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            Rejected: {req.rejectionReason}
                          </p>
                        )}
                      </div>
                      {req.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            id={`approve-request-${req.id}`}
                            size="sm"
                            onClick={() => handleApprove(req.id)}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            id={`reject-request-${req.id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => setRejectId(req.id)}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                          >
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>

                    {rejectId === req.id && (
                      <div className="mt-4 flex gap-2">
                        <Input
                          id={`reject-reason-input-${req.id}`}
                          placeholder="Rejection reason…"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <Button
                          id={`confirm-reject-${req.id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(req.id)}
                          className="rounded-xl border-red-200 text-red-600 shrink-0"
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectId(null)}
                          className="rounded-xl shrink-0"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    <p className="mt-3 text-xs text-muted-foreground">
                      Requested {new Date(req.requestedAt).toLocaleString()}
                      {req.reviewedAt && ` · Reviewed ${new Date(req.reviewedAt).toLocaleString()}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "colleges" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Active Colleges</h2>
              <button
                id="refresh-colleges-btn"
                onClick={fetchColleges}
                className="flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-secondary dark:border-white/10"
              >
                <RefreshCw className={cn("h-3 w-3", loadingColleges && "animate-spin")} />
                Refresh
              </button>
            </div>
            {loadingColleges ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-black/10 bg-card p-5 dark:border-white/10">
                    <div className="h-5 w-1/3 rounded bg-secondary" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-secondary" />
                  </div>
                ))}
              </div>
            ) : colleges.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/20 p-12 text-center dark:border-white/20">
                <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No colleges provisioned</p>
              </div>
            ) : (
              <div className="space-y-4">
                {colleges.map((college) => (
                  <div
                    key={college.id}
                    className="rounded-2xl border border-black/10 bg-card p-5 shadow-sm dark:border-white/10"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{college.name}</h3>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs font-medium",
                              college.isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                            )}
                          >
                            {college.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{college.domain}</p>
                        <p className="text-xs text-muted-foreground">Slug: {college.slug}</p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          Key: {college.apiKey?.slice(0, 20)}…
                        </p>
                      </div>
                      {college.isActive && (
                        <Button
                          id={`deactivate-college-${college.id}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivate(college.id)}
                          className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Provisioned {new Date(college.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "onboarding" && <OnboardingTab />}
      </main>
    </div>
  );
}
