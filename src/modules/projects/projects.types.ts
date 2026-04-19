export interface ProjectPublic {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  status: string;
  crossCollege: boolean;
  ownerId: string;
  ownerCollegeId: string;
  maxMembers: number;
  memberCount?: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface TeamMemberPublic {
  id: string;
  userId: string;
  userCollegeId: string;
  role: string;
  joinedAt: Date | null;
}
