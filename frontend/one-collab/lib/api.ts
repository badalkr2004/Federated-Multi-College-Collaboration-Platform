import type { TenantId } from "./types";
import { TENANTS } from "./types";

// Direct backend calls — works because hosts file maps:
//   127.0.0.1  projects.a.localhost
//   127.0.0.1  projects.b.localhost
// Browser automatically sets Host: projects.a.localhost from the URL,
// which is what the backend's resolveTenant middleware reads.

const BACKEND_PORT = "8000";

function tenantBaseUrl(tenantId: TenantId): string {
  const host = TENANTS[tenantId].host;
  return `http://${host}:${BACKEND_PORT}/api/v1`;
}

const PLATFORM_BASE = `http://localhost:${BACKEND_PORT}/api/v1`;

function getTenantHeaders(tenantId: TenantId, token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-College-Key": TENANTS[tenantId].apiKey,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function getAdminHeaders(adminToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
  return headers;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string; details?: unknown };
}

async function request<T>(url: string, options: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const json = await res.json();
    return json as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "Cannot reach backend. Is it running on port 8000?" },
    };
  }
}

// ── Platform: Admin ───────────────────────────────────────────────────────────
export const adminApi = {
  login: (email: string, password: string) =>
    request<{ token: string }>(`${PLATFORM_BASE}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  listRequests: (adminToken: string, status?: string) =>
    request<unknown[]>(
      `${PLATFORM_BASE}/admin/requests${status ? `?status=${status}` : ""}`,
      { headers: getAdminHeaders(adminToken) }
    ),

  approveRequest: (adminToken: string, id: string) =>
    request<unknown>(`${PLATFORM_BASE}/admin/requests/${id}/approve`, {
      method: "POST",
      headers: getAdminHeaders(adminToken),
    }),

  rejectRequest: (adminToken: string, id: string, reason: string) =>
    request<unknown>(`${PLATFORM_BASE}/admin/requests/${id}/reject`, {
      method: "POST",
      headers: getAdminHeaders(adminToken),
      body: JSON.stringify({ reason }),
    }),

  listColleges: (adminToken: string) =>
    request<unknown[]>(`${PLATFORM_BASE}/admin/colleges`, {
      headers: getAdminHeaders(adminToken),
    }),

  deactivateCollege: (adminToken: string, id: string) =>
    request<unknown>(`${PLATFORM_BASE}/admin/colleges/${id}/deactivate`, {
      method: "PATCH",
      headers: getAdminHeaders(adminToken),
    }),
};

// ── Platform: Onboarding ─────────────────────────────────────────────────────
export const onboardingApi = {
  submit: (data: {
    name: string;
    domain: string;
    emailDomain: string;
    contactName: string;
    contactEmail: string;
  }) =>
    request<{ id: string; status: string; requestedAt: string }>(
      `${PLATFORM_BASE}/onboarding/request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    ),

  getStatus: (id: string) =>
    request<{
      id: string;
      status: string;
      rejectionReason: string | null;
      requestedAt: string;
      reviewedAt: string | null;
    }>(`${PLATFORM_BASE}/onboarding/request/${id}/status`, {
      headers: { "Content-Type": "application/json" },
    }),
};

// ── Tenant: Auth ─────────────────────────────────────────────────────────────
export const authApi = {
  login: (tenantId: TenantId, email: string, password: string) =>
    request<{
      token: string;
      user: { id: string; name: string; email: string; collegeId: string; collegeSlug: string; role: string };
    }>(`${tenantBaseUrl(tenantId)}/auth/login`, {
      method: "POST",
      headers: getTenantHeaders(tenantId),
      body: JSON.stringify({ email, password }),
    }),

  register: (tenantId: TenantId, name: string, email: string, password: string) =>
    request<{
      token: string;
      user: { id: string; name: string; email: string; collegeId: string; collegeSlug: string; role: string };
    }>(`${tenantBaseUrl(tenantId)}/auth/register`, {
      method: "POST",
      headers: getTenantHeaders(tenantId),
      body: JSON.stringify({ name, email, password }),
    }),

  me: (tenantId: TenantId, token: string) =>
    request<import("./types").User>(`${tenantBaseUrl(tenantId)}/auth/me`, {
      headers: getTenantHeaders(tenantId, token),
    }),
};

// ── Tenant: Users ─────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: (tenantId: TenantId, token: string) =>
    request<import("./types").User>(`${tenantBaseUrl(tenantId)}/users/me`, {
      headers: getTenantHeaders(tenantId, token),
    }),

  updateMe: (tenantId: TenantId, token: string, data: { name?: string; bio?: string }) =>
    request<import("./types").User>(`${tenantBaseUrl(tenantId)}/users/me`, {
      method: "PATCH",
      headers: getTenantHeaders(tenantId, token),
      body: JSON.stringify(data),
    }),

  updateSkills: (tenantId: TenantId, token: string, skills: string[]) =>
    request<import("./types").User>(`${tenantBaseUrl(tenantId)}/users/me/skills`, {
      method: "PATCH",
      headers: getTenantHeaders(tenantId, token),
      body: JSON.stringify({ skills }),
    }),

  getById: (tenantId: TenantId, token: string, userId: string) =>
    request<import("./types").User>(`${tenantBaseUrl(tenantId)}/users/${userId}`, {
      headers: getTenantHeaders(tenantId, token),
    }),
};

// ── Tenant: Projects ──────────────────────────────────────────────────────────
export const projectsApi = {
  list: (tenantId: TenantId, token: string, params?: { status?: string; skill?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.skill) qs.set("skill", params.skill);
    const query = qs.toString() ? `?${qs}` : "";
    return request<import("./types").Project[]>(
      `${tenantBaseUrl(tenantId)}/projects${query}`,
      { headers: getTenantHeaders(tenantId, token) }
    );
  },

  getById: (tenantId: TenantId, token: string, projectId: string) =>
    request<import("./types").Project>(
      `${tenantBaseUrl(tenantId)}/projects/${projectId}`,
      { headers: getTenantHeaders(tenantId, token) }
    ),

  create: (
    tenantId: TenantId,
    token: string,
    data: {
      title: string;
      description: string;
      requiredSkills: string[];
      crossCollege: boolean;
      maxMembers: number;
    }
  ) =>
    request<import("./types").Project>(`${tenantBaseUrl(tenantId)}/projects`, {
      method: "POST",
      headers: getTenantHeaders(tenantId, token),
      body: JSON.stringify(data),
    }),

  update: (
    tenantId: TenantId,
    token: string,
    projectId: string,
    data: Partial<{
      title: string;
      description: string;
      requiredSkills: string[];
      crossCollege: boolean;
      maxMembers: number;
      status: string;
    }>
  ) =>
    request<import("./types").Project>(
      `${tenantBaseUrl(tenantId)}/projects/${projectId}`,
      {
        method: "PATCH",
        headers: getTenantHeaders(tenantId, token),
        body: JSON.stringify(data),
      }
    ),

  join: (tenantId: TenantId, token: string, projectId: string) =>
    request<{ message: string }>(
      `${tenantBaseUrl(tenantId)}/projects/${projectId}/join`,
      { method: "POST", headers: getTenantHeaders(tenantId, token) }
    ),

  leave: (tenantId: TenantId, token: string, projectId: string) =>
    request<{ message: string }>(
      `${tenantBaseUrl(tenantId)}/projects/${projectId}/leave`,
      { method: "DELETE", headers: getTenantHeaders(tenantId, token) }
    ),
};

// ── Tenant: Match ─────────────────────────────────────────────────────────────
export const matchApi = {
  projectsForMe: (tenantId: TenantId, token: string) =>
    request<import("./types").MatchedProject[]>(
      `${tenantBaseUrl(tenantId)}/match/projects`,
      { headers: getTenantHeaders(tenantId, token) }
    ),

  usersForProject: (tenantId: TenantId, token: string, projectId: string) =>
    request<import("./types").MatchedUser[]>(
      `${tenantBaseUrl(tenantId)}/match/users/${projectId}`,
      { headers: getTenantHeaders(tenantId, token) }
    ),
};

// ── Tenant: Reputation ────────────────────────────────────────────────────────
export const reputationApi = {
  rate: (
    tenantId: TenantId,
    token: string,
    projectId: string,
    data: { ratedUserId: string; score: number; comment?: string }
  ) =>
    request<null>(
      `${tenantBaseUrl(tenantId)}/reputation/projects/${projectId}/rate`,
      {
        method: "POST",
        headers: getTenantHeaders(tenantId, token),
        body: JSON.stringify(data),
      }
    ),

  getRatings: (tenantId: TenantId, token: string, userId: string) =>
    request<import("./types").Rating[]>(
      `${tenantBaseUrl(tenantId)}/reputation/users/${userId}`,
      { headers: getTenantHeaders(tenantId, token) }
    ),
};

// ── Tenant: Messages ──────────────────────────────────────────────────────────
export const messagesApi = {
  send: (tenantId: TenantId, token: string, projectId: string, content: string) =>
    request<import("./types").Message>(
      `${tenantBaseUrl(tenantId)}/messages/projects/${projectId}`,
      {
        method: "POST",
        headers: getTenantHeaders(tenantId, token),
        body: JSON.stringify({ content }),
      }
    ),

  list: (tenantId: TenantId, token: string, projectId: string, page = 1, limit = 50) =>
    request<import("./types").Message[]>(
      `${tenantBaseUrl(tenantId)}/messages/projects/${projectId}?page=${page}&limit=${limit}`,
      { headers: getTenantHeaders(tenantId, token) }
    ),
};
