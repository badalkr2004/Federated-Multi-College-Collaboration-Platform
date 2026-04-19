export interface MessagePublic {
  id: string;
  projectId: string;
  senderId: string;
  senderCollegeId: string;
  content: string;
  createdAt: Date | null;
}
