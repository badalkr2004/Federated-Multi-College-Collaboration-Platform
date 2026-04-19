import passport from 'passport';
import { initGoogleAuth } from './google';
import { initGitHubAuth } from './github';

export function initializePassport(): void {
  // Serialize user (for session-based auth if needed)
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: Express.User, done) => {
    done(null, user);
  });

  // Initialize OAuth strategies
  initGoogleAuth();
  initGitHubAuth();
}

export { initGoogleAuth } from './google';
export { initGitHubAuth } from './github';
