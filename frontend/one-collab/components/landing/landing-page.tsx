import {
  ArrowRight,
  CheckCircle2,
  MessagesSquare,
  Network,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";

import DotPattern from "@/components/ui/dot-pattern-1";
import { RadialOrbitalTimelineDemo } from "@/components/ui/radial-orbital-timeline-demo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackgroundPaths } from "@/components/ui/background-paths";

const stats = [
  { value: "2", label: "college tenants" },
  { value: "6", label: "demo students" },
  { value: "3", label: "seeded projects" },
  { value: "5 min", label: "match cache" },
];

const features = [
  {
    title: "Tenant-aware identity",
    copy: "Students sign in with their college key, while private projects stay visible only to the right campus.",
    icon: ShieldCheck,
    tone: "bg-emerald-500",
  },
  {
    title: "Skill-first matching",
    copy: "Project and teammate recommendations combine shared skills with reputation signals.",
    icon: Network,
    tone: "bg-sky-500",
  },
  {
    title: "Collaboration rooms",
    copy: "Every project can become a focused workspace with members, messages, ratings, and ownership.",
    icon: MessagesSquare,
    tone: "bg-rose-500",
  },
];

const workflow = [
  "Verify college access",
  "Build a skill profile",
  "Discover matching projects",
  "Join the right team",
];

const footerLinks = [
  {
    title: "Product",
    links: ["Projects", "Matchmaking", "Messages", "Reputation"],
  },
  {
    title: "Platform",
    links: ["Tenant access", "College API keys", "Redis cache", "PostgreSQL"],
  },
  {
    title: "Demo",
    links: ["Alice", "Bob", "Dave", "Seed data"],
  },
];

export function LandingPage() {
  return (
    <main className="bg-background text-foreground">
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-black/10 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-black/60">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="#" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-sm font-bold text-white dark:bg-white dark:text-black">
              OC
            </span>
            <span className="font-semibold">One Collab</span>
          </a>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#platform" className="transition-colors hover:text-foreground">
              Platform
            </a>
            <a href="#flow" className="transition-colors hover:text-foreground">
              Flow
            </a>
            <a href="#trust" className="transition-colors hover:text-foreground">
              Trust
            </a>
          </div>
          <Button asChild className="mr-12 hidden rounded-lg md:inline-flex">
            <a href="#get-started">
              Open Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </nav>
      </header>

      <BackgroundPaths
        title="One Collab"
        eyebrow="Cross-college project network"
        subtitle="A shared workspace where students discover projects, find skill-matched teammates, coordinate inside teams, and build reputation across colleges."
        actionLabel="Explore The Platform"
      />

      <section className="border-y border-black/10 bg-white dark:border-white/10 dark:bg-black">
        <div className="mx-auto grid max-w-7xl divide-y divide-black/10 px-6 dark:divide-white/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="py-7 sm:px-6">
              <p className="text-4xl font-bold tracking-normal">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="relative overflow-hidden py-24">
        <DotPattern
          width={8}
          height={8}
          className="fill-emerald-500/10 dark:fill-emerald-300/10"
        />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge className="border-black/10 bg-black text-white dark:border-white/10 dark:bg-white dark:text-black">
              Built for student builders
            </Badge>
            <h2 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl">
              Your next teammate might be one campus away.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
              One Collab gives colleges a shared collaboration layer without
              flattening tenant boundaries. Students can safely discover,
              join, message, and rate across the right projects.
            </p>
            <div className="mt-8 grid gap-3">
              {workflow.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div
              role="img"
              aria-label="Students collaborating around laptops"
              className="min-h-80 rounded-lg bg-cover bg-center sm:col-span-2"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.25)), url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80)",
              }}
            />
            <div className="relative min-h-56 overflow-hidden rounded-lg border border-black/10 bg-lime-50 p-6 text-black dark:border-white/10 dark:bg-zinc-900 dark:text-white">
              <DotPattern
                width={9}
                height={9}
                className="fill-lime-600/20 dark:fill-lime-300/10"
              />
              <div className="relative z-10">
                <Sparkles className="h-6 w-6 text-lime-700 dark:text-lime-300" />
                <p className="mt-8 text-3xl font-bold">Match by skills.</p>
                <p className="mt-3 text-sm leading-6 text-black/65 dark:text-white/65">
                  React, Python, ML, Docker, PostgreSQL, Redis, UI/UX, and more.
                </p>
              </div>
            </div>
            <div className="relative min-h-56 overflow-hidden rounded-lg bg-black p-6 text-white">
              <DotPattern
                width={10}
                height={10}
                className="fill-white/10"
              />
              <div className="relative z-10">
                <UsersRound className="h-6 w-6 text-sky-300" />
                <p className="mt-8 text-3xl font-bold">Build in teams.</p>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  Owners, members, project status, team limits, and cross-college rules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="trust"
        className="grid border-y border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-neutral-950 md:grid-cols-3"
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.title}
              className="border-black/10 p-8 dark:border-white/10 md:border-r md:last:border-r-0"
            >
              <div
                className={`mb-6 flex h-11 w-11 items-center justify-center rounded-lg text-white ${feature.tone}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-bold">{feature.title}</h3>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {feature.copy}
              </p>
            </article>
          );
        })}
      </section>

      <section className="bg-white py-24 dark:bg-black">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid overflow-hidden rounded-lg border border-black/10 dark:border-white/10 lg:grid-cols-[1fr_0.8fr]">
            <div className="relative p-8 sm:p-12">
              <DotPattern
                width={8}
                height={8}
                className="fill-rose-500/10 dark:fill-rose-300/10"
              />
              <div className="relative z-10">
                <p className="text-sm font-semibold uppercase text-rose-600 dark:text-rose-300">
                  Demo network
                </p>
                <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                  Alice can find Bob’s AI project. Dave can bring ML from another college.
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
                  The seeded data already models the product: College A,
                  College B, cross-college projects, skill overlap, private
                  campus projects, chat membership, and collaborator ratings.
                </p>
              </div>
            </div>
            <div className="grid border-t border-black/10 dark:border-white/10 lg:border-l lg:border-t-0">
              {[
                ["AI Study Assistant", "Cross-college project"],
                ["Campus Event App", "College A private project"],
                ["DevOps Pipeline Builder", "Cross-college project"],
              ].map(([title, detail]) => (
                <div
                  key={title}
                  className="flex items-center justify-between border-b border-black/10 p-6 last:border-b-0 dark:border-white/10"
                >
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {detail}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-lg">
                    Ready
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="flow">
        <RadialOrbitalTimelineDemo />
      </section>

      <section
        id="get-started"
        className="relative overflow-hidden bg-white px-6 py-24 text-center dark:bg-neutral-950"
      >
        <DotPattern
          width={10}
          height={10}
          className="fill-sky-500/15 dark:fill-sky-300/10"
        />
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-sky-500 text-white">
            <Star className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold uppercase text-sky-600 dark:text-sky-300">
            Launch the workspace
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-6xl">
            Start with login, then let projects pull the team together.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
            One Collab is ready for the next product screens: authentication,
            profile skills, project discovery, match results, project chat, and
            reputation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button className="rounded-lg">
              Continue To Auth
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="rounded-lg">
              View Project Flow
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-black text-white dark:border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <a href="#" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-black">
                OC
              </span>
              <span className="text-lg font-semibold">One Collab</span>
            </a>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/60">
              A federated multi-college platform for project discovery,
              teammate matching, collaboration, and reputation.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Badge className="border-white/10 bg-white/10 text-white">
                Express
              </Badge>
              <Badge className="border-white/10 bg-white/10 text-white">
                Next.js
              </Badge>
              <Badge className="border-white/10 bg-white/10 text-white">
                Drizzle
              </Badge>
              <Badge className="border-white/10 bg-white/10 text-white">
                Neon
              </Badge>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/55">
                  {group.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="transition-colors hover:text-white">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-5">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 One Collab. Built for CIMAGE hackathon teams.</p>
            <p>Cross-college building, without losing campus trust.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
