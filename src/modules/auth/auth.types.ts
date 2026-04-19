export interface AuthUser {
  userId: string;
  collegeId: string;
  collegeSlug: string;
  email: string;
}

export interface RegisterResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    collegeId: string;
    collegeSlug: string;
  };
}

export interface LoginResult extends RegisterResult {}
