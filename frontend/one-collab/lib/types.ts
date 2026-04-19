// Types matching the backend schema exactly

export interface College {
  id: string;
  name: string;
  slug: string;
  domain: string;
  emailDomain: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
}

export interface CollegeRequest {
  id: string;
  name: string;
  slug: string;
  domain: string;
  emailDomain: string;
  contactName: string;
  contactEmail: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  skills: string[];
  bio: string | null;
  role: "user" | "super_admin";
  reputation: number;
  avgRating: string;
  projectsCompleted: number;
  collegeId: string | null;
  collegeSlug?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  status: "open" | "in_progress" | "completed" | "cancelled";
  crossCollege: boolean;
  ownerId: string;
  ownerCollegeId: string;
  collegeId: string;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  projectId: string;
  userId: string;
  userCollegeId: string;
  role: "owner" | "member";
  joinedAt: string;
}

export interface Rating {
  id: string;
  projectId: string;
  raterId: string;
  raterCollegeId: string;
  ratedUserId: string;
  ratedUserCollegeId: string;
  score: number;
  comment: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderCollegeId: string;
  content: string;
  createdAt: string;
}

export interface MatchedProject {
  projectId: string;
  title: string;
  description?: string;
  requiredSkills: string[];
  crossCollege: boolean;
  score: number;
  skillOverlap: number;
}

export interface MatchedUser {
  userId: string;
  name: string;
  email: string;
  skills: string[];
  reputation: number;
  collegeId: string;
  skillOverlap: number;
  score: number;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    collegeId: string;
    collegeSlug: string;
    role: string;
  };
}

export type TenantId = "a" | "b";

export interface TenantConfig {
  id: TenantId;
  name: string;
  host: string;
  apiKey: string;
  color: string;
}

export const TENANTS: Record<TenantId, TenantConfig> = {
  a: {
    id: "a",
    name: "College A",
    host: process.env.NEXT_PUBLIC_COLLEGE_A_HOST ?? "projects.a.localhost",
    apiKey: process.env.NEXT_PUBLIC_COLLEGE_A_KEY ?? "cc_live_collegea000000000000000000000000000",
    color: "violet",
  },
  b: {
    id: "b",
    name: "College B",
    host: process.env.NEXT_PUBLIC_COLLEGE_B_HOST ?? "projects.b.localhost",
    apiKey: process.env.NEXT_PUBLIC_COLLEGE_B_KEY ?? "cc_live_collegeb000000000000000000000000000",
    color: "cyan",
  },
};
