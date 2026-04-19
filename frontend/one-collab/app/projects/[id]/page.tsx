"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { projectsApi, messagesApi, matchApi, reputationApi, usersApi } from "@/lib/api";
import type { Project, Message, MatchedUser } from "@/lib/types";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Lock,
  Users,
  Send,
  Star,
  RefreshCw,
  ArrowLeft,
  UserPlus,
  UserMinus,
  MessageSquare,
  Trophy,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300",
  in_progress: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300",
  completed: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
};

function RateModal({
  projectId,
  members,
  currentUserId,
  onClose,
}: {
  projectId: string;
  members: { userId: string; role: string }[];
  currentUserId: string;
  onClose: () => void;
}) {
  const { token, tenantId } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token || !tenantId) return;
    const others = members.filter((m) => m.userId !== currentUserId);
    Promise.all(
      others.map(async (m) => {
        const res = await usersApi.getById(tenantId, token, m.userId);
        return [m.userId, res.data?.name ?? m.userId] as [string, string];
      })
    ).then((entries) => setMemberNames(Object.fromEntries(entries)));
  }, [members, currentUserId, token, tenantId]);

  async function handleRate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !tenantId || !selectedUserId) return;
    setLoading(true);
    setError(null);
    const res = await reputationApi.rate(tenantId, token, projectId, {
      ratedUserId: selectedUserId,
      score,
      comment: comment || undefined,
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error?.message ?? "Rating failed");
      return;
    }
    setSuccess(true);
  }

  const rateable = members.filter((m) => m.userId !== currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/10 bg-card p-6 shadow-2xl dark:border-white/10 mx-4">
        <h2 className="text-lg font-bold mb-4">Rate a Collaborator</h2>
        {success ? (
          <div className="text-center py-6">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-amber-500" />
            <p className="font-medium">Rating submitted!</p>
            <p className="mt-1 text-sm text-muted-foreground">Their reputation has been updated.</p>
            <Button onClick={onClose} className="mt-4">Done</Button>
          </div>
        ) : (
          <form id="rate-collaborator-form" onSubmit={handleRate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Team member</label>
              <select
                id="rate-user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a member…</option>
                {rateable.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {memberNames[m.userId] ?? m.userId}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Score (1–5)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    id={`score-btn-${s}`}
                    onClick={() => setScore(s)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-all",
                      score >= s
                        ? "border-amber-400 bg-amber-400 text-white"
                        : "border-black/10 bg-secondary text-muted-foreground hover:border-amber-400 dark:border-white/10"
                    )}
                  >
                    <Star className="h-4 w-4" />
                  </button>
                ))}
                <span className="ml-2 text-sm font-medium tabular-nums">{score}/5</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Comment (optional)</label>
              <Input
                id="rate-comment-input"
                placeholder="Excellent ML skills and great communication"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button id="rate-submit-btn" type="submit" disabled={loading || !selectedUserId}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Rating"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, user, tenantId } = useAuth();
  const projectId = params?.id ?? "";

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingProject, setLoadingProject] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [tab, setTab] = useState<"messages" | "matches">("messages");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  const fetchProject = useCallback(async () => {
    if (!token || !tenantId || !projectId) return;
    setLoadingProject(true);
    const res = await projectsApi.getById(tenantId, token, projectId);
    setLoadingProject(false);
    if (res.success && res.data) setProject(res.data);
  }, [token, tenantId, projectId]);

  const fetchMessages = useCallback(async () => {
    if (!token || !tenantId || !projectId) return;
    const res = await messagesApi.list(tenantId, token, projectId);
    if (res.success && res.data) setMessages(res.data);
  }, [token, tenantId, projectId]);

  const fetchMatchedUsers = useCallback(async () => {
    if (!token || !tenantId || !projectId) return;
    const res = await matchApi.usersForProject(tenantId, token, projectId);
    if (res.success && res.data) setMatchedUsers(res.data);
  }, [token, tenantId, projectId]);

  useEffect(() => {
    fetchProject();
    fetchMessages();
  }, [fetchProject, fetchMessages]);

  useEffect(() => {
    if (tab === "matches") fetchMatchedUsers();
  }, [tab, fetchMatchedUsers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isMember = project?.members?.some((m) => m.userId === user?.id) ?? false;
  const isOwner = project?.members?.some((m) => m.userId === user?.id && m.role === "owner") ?? false;

  async function handleJoin() {
    if (!token || !tenantId) return;
    setJoining(true);
    const res = await projectsApi.join(tenantId, token, projectId);
    setJoining(false);
    if (res.success) {
      setActionMsg("You joined the project!");
      fetchProject();
    } else {
      setActionMsg(res.error?.message ?? "Failed to join");
    }
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function handleLeave() {
    if (!token || !tenantId) return;
    setLeaving(true);
    const res = await projectsApi.leave(tenantId, token, projectId);
    setLeaving(false);
    if (res.success) {
      setActionMsg("You left the project.");
      fetchProject();
    } else {
      setActionMsg(res.error?.message ?? "Failed to leave");
    }
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !tenantId || !messageInput.trim()) return;
    setSendingMsg(true);
    const res = await messagesApi.send(tenantId, token, projectId, messageInput);
    setSendingMsg(false);
    if (res.success) {
      setMessageInput("");
      fetchMessages();
    }
  }

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      {rateOpen && project?.members && user && (
        <RateModal
          projectId={projectId}
          members={project.members.map((m) => ({ userId: m.userId, role: m.role }))}
          currentUserId={user.id}
          onClose={() => setRateOpen(false)}
        />
      )}

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-6">
        <Link
          href="/projects"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Projects
        </Link>

        {loadingProject ? (
          <div className="space-y-4">
            <div className="h-8 w-1/2 animate-pulse rounded-lg bg-secondary" />
            <div className="h-4 w-full animate-pulse rounded bg-secondary" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
          </div>
        ) : !project ? (
          <div className="rounded-2xl border border-dashed border-black/20 p-16 text-center dark:border-white/20">
            <p className="font-medium">Project not found</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Main */}
            <div className="space-y-6">
              {/* Header */}
              <div className="rounded-2xl border border-black/10 bg-card p-6 shadow-sm dark:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold leading-tight">{project.title}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                          STATUS_COLORS[project.status] ?? "border-secondary bg-secondary"
                        )}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                      {project.crossCollege ? (
                        <span className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400">
                          <Globe className="h-3 w-3" />
                          Cross-college
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          College only
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {project.members?.length ?? 0}/{project.maxMembers} members
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isMember && (
                      <>
                        <Button
                          id="rate-btn"
                          variant="outline"
                          size="sm"
                          onClick={() => setRateOpen(true)}
                          className="rounded-xl"
                        >
                          <Star className="mr-1.5 h-3.5 w-3.5" />
                          Rate
                        </Button>
                        {!isOwner && (
                          <Button
                            id="leave-project-btn"
                            variant="outline"
                            size="sm"
                            onClick={handleLeave}
                            disabled={leaving}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                          >
                            {leaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="mr-1.5 h-3.5 w-3.5" />}
                            Leave
                          </Button>
                        )}
                      </>
                    )}
                    {!isMember && project.status === "open" && (
                      <Button
                        id="join-project-btn"
                        size="sm"
                        onClick={handleJoin}
                        disabled={joining}
                        className="rounded-xl"
                      >
                        {joining ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <UserPlus className="mr-1.5 h-3.5 w-3.5" />}
                        Join Project
                      </Button>
                    )}
                  </div>
                </div>

                {actionMsg && (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                    {actionMsg}
                  </div>
                )}

                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  {project.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.requiredSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-md border border-black/10 bg-secondary px-2 py-0.5 text-xs font-medium dark:border-white/10"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tabs: messages / matched users */}
              <div className="rounded-2xl border border-black/10 bg-card shadow-sm dark:border-white/10 overflow-hidden">
                <div className="flex border-b border-black/10 dark:border-white/10">
                  {(["messages", "matches"] as const).map((t) => (
                    <button
                      key={t}
                      id={`tab-${t}`}
                      onClick={() => setTab(t)}
                      className={cn(
                        "flex-1 py-3 text-sm font-medium capitalize transition-colors",
                        tab === t
                          ? "border-b-2 border-foreground text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t === "messages" ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Messages
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          Matched Users
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {tab === "messages" ? (
                  <div className="flex flex-col">
                    {/* Messages list */}
                    <div className="h-80 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {isMember
                                ? "No messages yet. Say hello!"
                                : "Join the project to view messages."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMe = msg.senderId === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={cn("flex gap-2", isMe && "flex-row-reverse")}
                            >
                              <div
                                className={cn(
                                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                                  isMe
                                    ? "bg-gradient-to-br from-violet-500 to-cyan-500"
                                    : "bg-zinc-700 dark:bg-zinc-600"
                                )}
                              >
                                {isMe ? user?.name[0] : "?"}
                              </div>
                              <div
                                className={cn(
                                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                                  isMe
                                    ? "bg-black text-white dark:bg-white dark:text-black rounded-tr-sm"
                                    : "bg-secondary rounded-tl-sm"
                                )}
                              >
                                <p>{msg.content}</p>
                                <p
                                  className={cn(
                                    "mt-0.5 text-xs",
                                    isMe ? "text-white/60 dark:text-black/60" : "text-muted-foreground"
                                  )}
                                >
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message input */}
                    {isMember ? (
                      <form
                        id="send-message-form"
                        onSubmit={handleSendMessage}
                        className="flex gap-2 border-t border-black/10 p-3 dark:border-white/10"
                      >
                        <Input
                          id="message-input"
                          placeholder="Send a message…"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          className="flex-1"
                          disabled={sendingMsg}
                        />
                        <Button
                          id="send-message-btn"
                          type="submit"
                          size="sm"
                          disabled={sendingMsg || !messageInput.trim()}
                          className="rounded-xl px-3"
                        >
                          {sendingMsg ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={fetchMessages}
                          className="rounded-xl px-3"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    ) : (
                      <div className="border-t border-black/10 p-3 text-center text-sm text-muted-foreground dark:border-white/10">
                        Join the project to send messages
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {matchedUsers.length === 0 ? (
                      <div className="py-8 text-center">
                        <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No matched users found</p>
                      </div>
                    ) : (
                      matchedUsers.map((mu) => (
                        <div
                          key={mu.userId}
                          className="flex items-center justify-between rounded-xl border border-black/10 p-4 dark:border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-sm font-bold text-white">
                              {mu.name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{mu.name}</p>
                              <p className="text-xs text-muted-foreground">{mu.email}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {mu.skills.slice(0, 3).map((s) => (
                                  <span
                                    key={s}
                                    className="rounded-md border border-black/10 px-1.5 py-0.5 text-xs dark:border-white/10"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-muted-foreground">Match</p>
                            <p className="text-lg font-bold">
                              {Math.round(mu.score * 100)}%
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Team Members */}
              <div className="rounded-2xl border border-black/10 bg-card p-5 shadow-sm dark:border-white/10">
                <h2 className="mb-4 font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-sky-500" />
                  Team Members
                </h2>
                {project.members && project.members.length > 0 ? (
                  <div className="space-y-3">
                    {project.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-bold text-white">
                            {m.userId === user?.id ? user?.name[0] : "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {m.userId === user?.id ? user?.name : `Member`}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize text-xs",
                            m.role === "owner" && "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300"
                          )}
                        >
                          {m.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No members yet</p>
                )}
              </div>

              {/* Project info */}
              <div className="rounded-2xl border border-black/10 bg-card p-5 shadow-sm dark:border-white/10">
                <h2 className="mb-4 font-semibold">Project Info</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Updated</dt>
                    <dd className="font-medium">{new Date(project.updatedAt).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Max members</dt>
                    <dd className="font-medium">{project.maxMembers}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium flex items-center gap-1">
                      {project.crossCollege ? (
                        <><Globe className="h-3.5 w-3.5 text-cyan-500" /> Cross-college</>
                      ) : (
                        <><Lock className="h-3.5 w-3.5" /> Private</>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
