import passport from 'passport';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { env } from '../../utils/env';
import { OAuthProfile } from '../../types';

// Initialize GitHub OAuth strategy
export function initGitHubAuth(): void {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    console.warn('GitHub OAuth not configured - skipping initialization');
    return;
  }

  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL || `${env.API_URL}/api/auth/github/callback`,
        scope: ['user:email'],
      },
      async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: (error: Error | null, user?: OAuthProfile) => void) => {
        try {
          const oauthProfile = transformGitHubProfile(profile, accessToken, refreshToken);
          done(null, oauthProfile);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

// GitHub email type (the passport-github2 types are incomplete)
interface GitHubEmail {
  value: string;
  type?: string;
  primary?: boolean;
}

// Transform GitHub profile to our standard format
function transformGitHubProfile(
  profile: GitHubProfile,
  accessToken: string,
  refreshToken?: string
): OAuthProfile {
  // GitHub may return multiple emails, find the primary one
  const emails = (profile.emails || []) as GitHubEmail[];
  const primaryEmail = emails.find((e) => e.primary)?.value || emails[0]?.value;
  
  if (!primaryEmail) {
    throw new Error('No email found in GitHub profile. Please make your email public on GitHub.');
  }

  return {
    provider: 'github',
    id: profile.id,
    email: primaryEmail,
    name: profile.displayName || profile.username || null,
    avatarUrl: profile.photos?.[0]?.value || null,
    accessToken,
    refreshToken,
  };
}
