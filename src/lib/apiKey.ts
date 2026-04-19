import { randomBytes } from 'crypto';
import { CONSTANTS } from '../config/constants.js';

/**
 * Generates a cryptographically secure API key.
 * Format: cc_live_<32 hex chars>
 */
export function generateApiKey(): string {
  return `${CONSTANTS.API_KEY_PREFIX}${randomBytes(16).toString('hex')}`;
}
