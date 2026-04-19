"use client";

import {
  BadgeCheck,
  Code,
  MessageSquare,
  Network,
  ShieldCheck,
  Star,
} from "lucide-react";

import RadialOrbitalTimeline, {
  type TimelineItem,
} from "@/components/ui/radial-orbital-timeline";

const timelineData: TimelineItem[] = [
  {
    id: 1,
    title: "College Login",
    date: "Step 01",
    content:
      "Students enter with their college API key, keeping each campus identity tied to the right tenant.",
    category: "Auth",
    icon: ShieldCheck,
    relatedIds: [2, 3],
    status: "completed",
    energy: 92,
  },
  {
    id: 2,
    title: "Skill Profile",
    date: "Step 02",
    content:
      "Each student maintains a compact profile with skills, bio, reputation, and project history.",
    category: "Profile",
    icon: BadgeCheck,
    relatedIds: [1, 3, 6],
    status: "completed",
    energy: 86,
  },
  {
    id: 3,
    title: "Project Match",
    date: "Step 03",
    content:
      "Jaccard skill overlap and reputation rank the projects and teammates most likely to fit.",
    category: "Match",
    icon: Network,
    relatedIds: [2, 4],
    status: "in-progress",
    energy: 95,
  },
  {
    id: 4,
    title: "Team Build",
    date: "Step 04",
    content:
      "Students join open projects while cross-college rules protect private campus workspaces.",
    category: "Projects",
    icon: Code,
    relatedIds: [3, 5],
    status: "in-progress",
    energy: 78,
  },
  {
    id: 5,
    title: "Project Chat",
    date: "Step 05",
    content:
      "Project members coordinate in member-only threads with paginated history for every team.",
    category: "Messages",
    icon: MessageSquare,
    relatedIds: [4, 6],
    status: "pending",
    energy: 64,
  },
  {
    id: 6,
    title: "Reputation",
    date: "Step 06",
    content:
      "Collaborators rate each other after working together, improving future team matching.",
    category: "Trust",
    icon: Star,
    relatedIds: [2, 5],
    status: "pending",
    energy: 70,
  },
];

export function RadialOrbitalTimelineDemo() {
  return <RadialOrbitalTimeline timelineData={timelineData} />;
}
