export interface MatchedProject {
  projectId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  ownerCollegeId: string;
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
  collegeSlug: string;
  score: number;
  skillOverlap: number;
}
