"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { matchApi, projectsApi, usersApi } from "@/lib/api";
import type { MatchedProject, Project } from "@/lib/types";
import { AppNav } from "@/components/app-nav";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  FolderOpen,
  Zap,
  Star,
  TrendingUp,
  Users,
  ArrowRight,
  RefreshCw,
  Globe,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

function SkillBadge({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-black/10 bg-secondary px-2 py-0.5 text-xs font-medium dark:border-white/10">
      {skill}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, tenantId } = useAuth();

  const [matches, setMatches] = useState<MatchedProject[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  const fetchMatches = useCallback(async () => {
    if (!token || !tenantId) return;
    setLoadingMatch(true);
    const res = await matchApi.projectsForMe(tenantId, token);
    setLoadingMatch(false);
    if (res.success && res.data) {
      setMatches(res.data.slice(0, 5));
      setRefreshedAt(new Date());
    }
  }, [token, tenantId]);

  const fetchProjects = useCallback(async () => {
    if (!token || !tenantId) return;
    setLoadingProjects(true);
    const res = await projectsApi.list(tenantId, token, { status: "open" });
    setLoadingProjects(false);
    if (res.success && res.data) {
      setRecentProjects(res.data.slice(0, 4));
    }
  }, [token, tenantId]);

  useEffect(() => {
    fetchMatches();
    fetchProjects();
  }, [fetchMatches, fetchProjects]);

  if (!token || !user) return null;

  const stats = [
    { label: "Reputation", value: user.reputation ?? 0, icon: Star, color: "text-amber-500" },
    { label: "Avg Rating", value: parseFloat(user.avgRating ?? "0").toFixed(1), icon: TrendingUp, color: "text-emerald-500" },
    { label: "Projects Done", value: user.projectsCompleted ?? 0, icon: FolderOpen, color: "text-sky-500" },
    { label: "Skills", value: (user.skills ?? []).length, icon: Zap, color: "text-violet-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-6">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s matched for you today
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-black/10 bg-card p-4 shadow-sm dark:border-white/10"
            >
              <Icon className={cn("h-4 w-4 mb-2", color)} />
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Matched Projects */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <h2 className="font-semibold">Matched for you</h2>
              </div>
              <button
                id="refresh-matches-btn"
                onClick={fetchMatches}
                disabled={loadingMatch}
                className="flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-secondary dark:border-white/10 disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3 w-3", loadingMatch && "animate-spin")} />
                Refresh
              </button>
            </div>

            {loadingMatch && matches.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl border border-black/10 bg-card p-5 dark:border-white/10"
                  >
                    <div className="h-4 w-2/3 rounded bg-secondary" />
                    <div className="mt-3 h-3 w-full rounded bg-secondary" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-secondary" />
                  </div>
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/20 p-8 text-center dark:border-white/20">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No matches yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add skills to your profile to get matched with projects
                </p>
                <Link
                  href="/profile"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-black"
                >
                  Update skills
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => (
                  <Link
                    key={m.projectId}
                    href={`/projects/${m.projectId}`}
                    id={`match-project-${m.projectId}`}
                    className="group block rounded-xl border border-black/10 bg-card p-5 shadow-sm transition-all hover:border-black/20 hover:shadow-md dark:border-white/10 dark:hover:border-white/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold leading-tight group-hover:underline">
                            {m.title}
                          </p>
                          {m.crossCollege && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-xs font-medium text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300">
                              <Globe className="h-3 w-3" />
                              Cross-college
                            </span>
                          )}
                        </div>
                        <ScoreBar score={m.score} />
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {m.requiredSkills.slice(0, 4).map((s) => (
                            <SkillBadge key={s} skill={s} />
                          ))}
                          {m.requiredSkills.length > 4 && (
                            <span className="text-xs text-muted-foreground">
                              +{m.requiredSkills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
                <Link
                  href="/projects"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/20 py-3 text-sm text-muted-foreground transition-colors hover:border-black/40 hover:text-foreground dark:border-white/20 dark:hover:border-white/40"
                >
                  View all projects
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {refreshedAt && (
              <p className="mt-2 text-right text-xs text-muted-foreground">
                Last refreshed {refreshedAt.toLocaleTimeString()}
              </p>
            )}
          </section>

          {/* Right column */}
          <div className="space-y-6">
            {/* Profile snapshot */}
            <section className="rounded-2xl border border-black/10 bg-card p-5 shadow-sm dark:border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Your profile</h2>
                <Link
                  href="/profile"
                  id="dashboard-profile-link"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-lg font-bold text-white">
                    {user.name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {user.bio && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {user.bio}
                  </p>
                )}

                {(user.skills ?? []).length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {user.skills.map((s) => (
                      <SkillBadge key={s} skill={s} />
                    ))}
                  </div>
                ) : (
                  <Link
                    href="/profile"
                    className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Zap className="h-3 w-3" />
                    Add skills to get matched
                  </Link>
                )}
              </div>
            </section>

            {/* Open Projects */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-sky-500" />
                  <h2 className="font-semibold">Open projects</h2>
                </div>
                <Link
                  href="/projects"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Browse all
                </Link>
              </div>

              {loadingProjects ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse rounded-xl border border-black/10 bg-card p-4 dark:border-white/10">
                      <div className="h-4 w-3/4 rounded bg-secondary" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-secondary" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      id={`dashboard-project-${p.id}`}
                      className="group flex items-center justify-between rounded-xl border border-black/10 bg-card p-4 transition-all hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium group-hover:underline">
                          {p.title}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          {p.crossCollege ? (
                            <Globe className="h-3 w-3 text-cyan-500" />
                          ) : (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {p.crossCollege ? "Cross-college" : "Private"}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2 flex-shrink-0 capitalize text-xs">
                        {p.status.replace("_", " ")}
                      </Badge>
                    </Link>
                  ))}
                  {recentProjects.length === 0 && !loadingProjects && (
                    <p className="rounded-xl border border-dashed border-black/20 p-4 text-center text-sm text-muted-foreground dark:border-white/20">
                      No open projects found
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
