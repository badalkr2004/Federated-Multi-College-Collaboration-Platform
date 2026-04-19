"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { usersApi, reputationApi } from "@/lib/api";
import type { Rating } from "@/lib/types";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Star,
  Zap,
  Trophy,
  X,
  Plus,
  Check,
  Pencil,
  TrendingUp,
  FolderOpen,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTED_SKILLS = [
  "React", "Vue.js", "Angular", "Next.js", "TypeScript", "JavaScript",
  "Python", "Node.js", "Express", "FastAPI", "Django", "Flask",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes",
  "ML", "AI", "TensorFlow", "PyTorch", "Rust", "Go", "Java", "C++",
  "iOS", "Android", "Flutter", "React Native", "GraphQL", "REST",
  "UI/UX", "Figma", "DevOps", "AWS", "GCP", "Azure", "Git",
];

function StarRating({ value }: { value: number }) {
  const fullStars = Math.floor(value);
  const partial = value - fullStars;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="relative h-4 w-4">
          <Star className="absolute h-4 w-4 text-secondary fill-secondary" />
          {s <= fullStars ? (
            <Star className="absolute h-4 w-4 text-amber-400 fill-amber-400" />
          ) : s === fullStars + 1 && partial > 0 ? (
            <div
              className="absolute overflow-hidden"
              style={{ width: `${partial * 100}%` }}
            >
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { token, user, tenantId, setTenantAuth } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [skillsMsg, setSkillsMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio ?? "");
      setSkills(user.skills ?? []);
    }
  }, [user]);

  const fetchRatings = useCallback(async () => {
    if (!token || !tenantId || !user) return;
    setLoadingRatings(true);
    const res = await reputationApi.getRatings(tenantId, token, user.id);
    setLoadingRatings(false);
    if (res.success && res.data) setRatings(res.data);
  }, [token, tenantId, user]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  async function handleSaveProfile() {
    if (!token || !tenantId || !user) return;
    setSavingProfile(true);
    const res = await usersApi.updateMe(tenantId, token, { name, bio: bio || undefined });
    setSavingProfile(false);
    if (res.success && res.data) {
      setTenantAuth(token, { ...user, ...res.data }, tenantId);
      setEditing(false);
      setProfileMsg("Profile updated!");
    } else {
      setProfileMsg(res.error?.message ?? "Failed to update");
    }
    setTimeout(() => setProfileMsg(null), 3000);
  }

  async function handleSaveSkills() {
    if (!token || !tenantId || !user) return;
    setSavingSkills(true);
    const res = await usersApi.updateSkills(tenantId, token, skills);
    setSavingSkills(false);
    if (res.success && res.data) {
      setTenantAuth(token, { ...user, ...res.data }, tenantId);
      setSkillsMsg("Skills updated! Match cache cleared.");
    } else {
      setSkillsMsg(res.error?.message ?? "Failed to update skills");
    }
    setTimeout(() => setSkillsMsg(null), 3000);
  }

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  if (!token || !user) return null;

  const avgRating = parseFloat(user.avgRating ?? "0");

  const statsCards = [
    { label: "Reputation", value: user.reputation ?? 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Avg Rating", value: avgRating.toFixed(1), icon: Star, color: "text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Projects Done", value: user.projectsCompleted ?? 0, icon: FolderOpen, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-900/20" },
    { label: "Total Ratings", value: ratings.length, icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 md:px-6">
        <h1 className="mb-6 text-3xl font-bold">My Profile</h1>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statsCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className={cn("rounded-2xl border border-black/10 p-4 shadow-sm dark:border-white/10", bg)}
            >
              <Icon className={cn("h-4 w-4 mb-2", color)} />
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Profile Info */}
          <section className="rounded-2xl border border-black/10 bg-card p-6 shadow-sm dark:border-white/10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Personal Info</h2>
              {!editing ? (
                <button
                  id="edit-profile-btn"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-secondary dark:border-white/10"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(false); setName(user.name); setBio(user.bio ?? ""); }}
                    className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-secondary dark:border-white/10"
                  >
                    Cancel
                  </button>
                  <Button
                    id="save-profile-btn"
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="rounded-xl text-xs"
                  >
                    {savingProfile ? "Saving…" : <><Check className="mr-1 h-3 w-3" />Save</>}
                  </Button>
                </div>
              )}
            </div>

            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-2xl font-bold text-white">
                {user.name[0]}
              </div>
              <div>
                <p className="font-bold text-lg">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <StarRating value={avgRating} />
              </div>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name-input">Name</Label>
                  <Input
                    id="profile-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-bio-input">Bio</Label>
                  <textarea
                    id="profile-bio-input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Full-stack developer at College A..."
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">College</p>
                  <p className="mt-1 text-sm font-medium capitalize">{user.collegeSlug?.replace("_", " ") ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</p>
                  <p className="mt-1 text-sm font-medium capitalize">{user.role.replace("_", " ")}</p>
                </div>
                {user.bio && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bio</p>
                    <p className="mt-1 text-sm leading-relaxed">{user.bio}</p>
                  </div>
                )}
              </div>
            )}

            {profileMsg && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                {profileMsg}
              </div>
            )}
          </section>

          {/* Skills */}
          <section className="rounded-2xl border border-black/10 bg-card p-6 shadow-sm dark:border-white/10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-violet-500" />
                Skills
              </h2>
              <Button
                id="save-skills-btn"
                size="sm"
                onClick={handleSaveSkills}
                disabled={savingSkills}
                className="rounded-xl text-xs"
              >
                {savingSkills ? "Saving…" : <><Check className="mr-1 h-3 w-3" />Save Skills</>}
              </Button>
            </div>

            {/* Current skills */}
            <div className="mb-4 flex min-h-12 flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300"
                >
                  {s}
                  <button
                    id={`remove-skill-${s.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => removeSkill(s)}
                    className="rounded-full hover:text-violet-900 dark:hover:text-violet-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              )}
            </div>

            {/* Add skill input */}
            <div className="flex gap-2 mb-4">
              <Input
                id="add-skill-input"
                placeholder="Type a skill…"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
              />
              <Button
                id="add-skill-btn"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSkill(skillInput)}
                className="rounded-xl shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Suggestions */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 18).map((s) => (
                  <button
                    key={s}
                    id={`suggest-skill-${s.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => addSkill(s)}
                    className="rounded-full border border-black/10 bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:hover:border-violet-600 dark:hover:bg-violet-900/20 dark:hover:text-violet-300"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {skillsMsg && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                {skillsMsg}
              </div>
            )}
          </section>
        </div>

        {/* Ratings */}
        <section className="mt-6 rounded-2xl border border-black/10 bg-card p-6 shadow-sm dark:border-white/10">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <h2 className="font-semibold">Rating History</h2>
          </div>

          {loadingRatings ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-black/10 p-4 dark:border-white/10">
                  <div className="h-4 w-1/3 rounded bg-secondary" />
                  <div className="mt-2 h-3 w-full rounded bg-secondary" />
                </div>
              ))}
            </div>
          ) : ratings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/20 p-10 text-center dark:border-white/20">
              <Star className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No ratings yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Join projects and collaborate to earn reputation
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {ratings.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-black/10 p-4 dark:border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-3.5 w-3.5",
                            s <= r.score
                              ? "fill-amber-400 text-amber-400"
                              : "fill-secondary text-secondary"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Project: {r.projectId.slice(0, 8)}…
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
