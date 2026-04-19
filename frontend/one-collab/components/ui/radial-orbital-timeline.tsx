"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}


interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

// Lightweight replacement — CSS-only step cards, no RAF/setInterval/framer-motion
export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [active, setActive] = useState<number | null>(null);

  const statusLabel: Record<string, string> = {
    completed: "LIVE",
    "in-progress": "ACTIVE",
    pending: "NEXT",
  };

  const statusStyle: Record<string, string> = {
    completed: "border-emerald-400 bg-emerald-400/20 text-emerald-300",
    "in-progress": "border-sky-400 bg-sky-400/20 text-sky-300",
    pending: "border-white/30 bg-white/10 text-white/60",
  };

  return (
    <section className="bg-black px-4 py-24 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/50">
            Platform Flow
          </p>
          <h2 className="text-4xl font-bold sm:text-5xl">
            From profile to project team
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/60">
            One Collab connects college identity, skills, matchmaking, projects,
            team chat, and reputation into one shared workspace.
          </p>
        </div>

        {/* Step grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {timelineData.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(isActive ? null : item.id)}
                className={`
                  group w-full rounded-2xl border text-left transition-all duration-200
                  ${
                    isActive
                      ? "border-white/30 bg-white/10 shadow-lg shadow-white/5"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                  }
                `}
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                          isActive
                            ? "border-white bg-white text-black"
                            : "border-white/30 bg-white/10 text-white/70"
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="font-mono text-xs text-white/40">
                        {item.date}
                      </span>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        statusStyle[item.status] ?? "border-white/20 text-white/40"
                      }`}
                    >
                      {statusLabel[item.status] ?? item.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 font-semibold text-white">{item.title}</h3>

                  {/* Content — shown when active */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-xs leading-5 text-white/65">
                      {item.content}
                    </p>

                    {/* Impact bar */}
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-white/40">
                        <span>Impact</span>
                        <span>{item.energy}%</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-white transition-all duration-500"
                          style={{ width: isActive ? `${item.energy}%` : "0%" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expand hint */}
                  {!isActive && (
                    <p className="mt-1 text-xs text-white/35 group-hover:text-white/50 transition-colors">
                      Click to expand
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Connect arrow */}
        <div className="mt-10 flex items-center justify-center gap-3 text-sm text-white/40">
          <span>College auth</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Skills</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Match</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Team</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Chat</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Reputation</span>
        </div>
      </div>
    </section>
  );
}


