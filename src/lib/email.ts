import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!resend) {
    logger.info({ to: opts.to, subject: opts.subject }, '📧 [DEV] Email would be sent');
    return;
  }
  try {
    await resend.emails.send({
      from: `CollabHub <${env.ADMIN_EMAIL}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to send email');
  }
}

export async function notifyAdminOfNewRequest(request: {
  name: string;
  contactEmail: string;
  domain: string;
  id: string;
}): Promise<void> {
  await sendEmail({
    to: env.ADMIN_EMAIL,
    subject: `[CollabHub] New onboarding request: ${request.name}`,
    html: `
      <h2>New College Onboarding Request</h2>
      <p><strong>College:</strong> ${request.name}</p>
      <p><strong>Domain:</strong> ${request.domain}</p>
      <p><strong>Contact:</strong> ${request.contactEmail}</p>
      <p><strong>Request ID:</strong> ${request.id}</p>
      <p>Login to the admin panel to approve or reject this request.</p>
    `,
  });
}

export async function sendCollegeApprovalEmail(opts: {
  to: string;
  contactName: string;
  collegeName: string;
  domain: string;
  apiKey: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `[CollabHub] Your college has been approved — ${opts.collegeName}`,
    html: `
      <h2>Welcome to CollabHub, ${opts.contactName}!</h2>
      <p>Your request for <strong>${opts.collegeName}</strong> has been approved.</p>
      <h3>Your Platform Credentials</h3>
      <p><strong>Domain:</strong> ${opts.domain}</p>
      <p><strong>API Key (one-time reveal):</strong> <code>${opts.apiKey}</code></p>
      <p>⚠️ Store this API key securely — it will not be shown again.</p>
      <p>Your users can now register at <code>http://${opts.domain}</code></p>
    `,
  });
}

export async function sendCollegeRejectionEmail(opts: {
  to: string;
  contactName: string;
  collegeName: string;
  reason: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `[CollabHub] Onboarding request for ${opts.collegeName} — not approved`,
    html: `
      <h2>Onboarding Request Update</h2>
      <p>Dear ${opts.contactName},</p>
      <p>Unfortunately, your onboarding request for <strong>${opts.collegeName}</strong> was not approved.</p>
      <p><strong>Reason:</strong> ${opts.reason}</p>
      <p>You may resubmit with corrections if needed.</p>
    `,
  });
}
