export interface RatingPublic {
  id: string;
  projectId: string;
  raterId: string;
  ratedUserId: string;
  score: number;
  comment: string | null;
  createdAt: Date | null;
}
