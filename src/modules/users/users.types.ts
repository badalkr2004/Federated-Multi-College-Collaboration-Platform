export interface UserPublic {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  skills: string[];
  reputation: number;
  projectsCompleted: number;
  avgRating: string | null;
  collegeId: string;
  collegeSlug: string;
}
