"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { projectsApi } from "@/lib/api";
import type { Project } from "@/lib/types";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Globe,
  Lock,
  ArrowRight,
  FolderOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

function CreateProjectModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { token, tenantId } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [crossCollege, setCrossCollege] = useState(false);
  const [maxMembers, setMaxMembers] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !tenantId) return;
    setLoading(true);
    setError(null);
    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await projectsApi.create(tenantId, token, {
      title,
      description,
      requiredSkills: skills,
      crossCollege,
      maxMembers,
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error?.message ?? "Failed to create project");
      return;
    }
    setTitle("");
    setDescription("");
    setSkillsText("");
    setCrossCollege(false);
    setMaxMembers(5);
    onCreated();
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-black/10 bg-card p-6 shadow-2xl dark:border-white/10 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Create Project</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form id="create-project-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              id="project-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="AI Study Assistant"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              id="project-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A smart student assistant using ML..."
              required
              rows={3}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Required Skills</label>
            <Input
              id="project-skills-input"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Python, ML, React (comma-separated)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max Members</label>
              <Input
                id="project-maxmembers-input"
                type="number"
                min={2}
                max={10}
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Access</label>
              <Select
                id="project-access-select"
                value={crossCollege ? "cross" : "private"}
                onChange={(e) => setCrossCollege(e.target.value === "cross")}
              >
                <option value="private">College only</option>
                <option value="cross">Cross-college</option>
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button id="create-project-submit-btn" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_OPTIONS = ["", "open", "in_progress", "completed", "cancelled"];

export default function ProjectsPage() {
  const router = useRouter();
  const { token, tenantId } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  const fetchProjects = useCallback(async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    const params: { status?: string; skill?: string } = {};
    if (status) params.status = status;
    if (skillFilter) params.skill = skillFilter;
    const res = await projectsApi.list(tenantId, token, params);
    setLoading(false);
    if (res.success && res.data) setProjects(res.data);
  }, [token, tenantId, status, skillFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = projects.filter((p) =>
    search
      ? p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const statusColor: Record<string, string> = {
    open: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300",
    in_progress: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300",
    completed: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300",
    cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchProjects}
      />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse and join collaborative projects
            </p>
          </div>
          <Button
            id="open-create-project-btn"
            onClick={() => setModalOpen(true)}
            className="shrink-0 rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="project-search-input"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            id="project-status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="sm:w-44"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </Select>
          <Input
            id="project-skill-filter"
            placeholder="Skill filter…"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="sm:w-44"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-black/10 bg-card p-6 dark:border-white/10"
              >
                <div className="h-5 w-3/4 rounded bg-secondary" />
                <div className="mt-3 h-4 w-full rounded bg-secondary" />
                <div className="mt-2 h-4 w-2/3 rounded bg-secondary" />
                <div className="mt-4 flex gap-2">
                  <div className="h-6 w-16 rounded bg-secondary" />
                  <div className="h-6 w-16 rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/20 p-16 text-center dark:border-white/20">
            <FolderOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No projects found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try changing the filters or create a new project
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                id={`project-card-${p.id}`}
                className="group rounded-2xl border border-black/10 bg-card p-6 shadow-sm transition-all hover:border-black/20 hover:shadow-md dark:border-white/10 dark:hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight group-hover:underline">
                    {p.title}
                  </h3>
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                      statusColor[p.status] ?? "border-secondary bg-secondary"
                    )}
                  >
                    {p.status.replace("_", " ")}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {p.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.requiredSkills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-md border border-black/10 bg-secondary px-2 py-0.5 text-xs font-medium dark:border-white/10"
                    >
                      {s}
                    </span>
                  ))}
                  {p.requiredSkills.length > 3 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{p.requiredSkills.length - 3}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      {p.crossCollege ? (
                        <Globe className="h-3 w-3 text-cyan-500" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      {p.crossCollege ? "Cross-college" : "Private"}
                    </span>
                    <span>≤{p.maxMembers} members</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
