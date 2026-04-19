import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { env } from '../../utils/env';
import { OAuthProfile } from '../../types';

// Initialize Google OAuth strategy
export function initGoogleAuth(): void {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth not configured - skipping initialization');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL || `${env.API_URL}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthProfile = transformGoogleProfile(profile, accessToken, refreshToken);
          done(null, oauthProfile as any);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
}

// Transform Google profile to our standard format
function transformGoogleProfile(
  profile: GoogleProfile,
  accessToken: string,
  refreshToken?: string
): OAuthProfile {
  const email = profile.emails?.[0]?.value;
  
  if (!email) {
    throw new Error('No email found in Google profile');
  }

  return {
    provider: 'google',
    id: profile.id,
    email,
    name: profile.displayName || null,
    avatarUrl: profile.photos?.[0]?.value || null,
    accessToken,
    refreshToken,
  };
}
