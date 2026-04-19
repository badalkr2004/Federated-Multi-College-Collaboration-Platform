import { Resend } from 'resend';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

// Initialize Resend client
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Send email using Resend
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!resend) {
    logger.warn({ subject: options.subject }, 'Email service not configured. Email not sent');
    // In development, log the email content for testing
    if (env.NODE_ENV === 'development') {
      logger.info({
        to: options.to,
        subject: options.subject,
        html: options.html.substring(0, 200) + '...',
      }, 'Mock email sent');
    }
    return false;
  }

  try {
    const result = await resend.emails.send({
      from: env.EMAIL_FROM || 'noreply@example.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info({ emailId: result.data?.id, to: options.to }, 'Email sent successfully');
    return true;
  } catch (error) {
    logger.error({ error, to: options.to, subject: options.subject }, 'Failed to send email');
    return false;
  }
}

// Email templates
export const emailTemplates = {
  // Email verification
  verification: (name: string, verificationUrl: string) => ({
    subject: 'Verify your email address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Verify Email</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome${name ? `, ${name}` : ''}! 👋</h1>
            <p>Thanks for signing up! Please verify your email address to complete your registration.</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome${name ? `, ${name}` : ''}! Verify your email: ${verificationUrl}`,
  }),

  // Password reset
  passwordReset: (name: string, resetUrl: string) => ({
    subject: 'Reset your password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Reset Password</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #DC2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
            .warning { background: #FEF3C7; padding: 12px; border-radius: 6px; border-left: 4px solid #F59E0B; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Password Reset Request</h1>
            <p>Hi${name ? ` ${name}` : ''},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
            <div class="footer">
              <p>For security, this request was received from a web browser. If you have concerns, please contact support.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Password reset requested. Reset your password: ${resetUrl}. This link expires in 1 hour.`,
  }),

  // Welcome email (after verification)
  welcome: (name: string) => ({
    subject: 'Welcome! Your account is ready',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 You're all set${name ? `, ${name}` : ''}!</h1>
            <p>Your email has been verified and your account is now active.</p>
            <p>You can now enjoy all the features of our platform.</p>
            <div class="footer">
              <p>Thanks for joining us!</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome${name ? `, ${name}` : ''}! Your email has been verified and your account is ready.`,
  }),
};

// Send verification email
export async function sendVerificationEmail(
  email: string,
  name: string | null,
  token: string
): Promise<boolean> {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  const template = emailTemplates.verification(name || '', verificationUrl);
  
  return sendEmail({
    to: email,
    ...template,
  });
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  name: string | null,
  token: string
): Promise<boolean> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const template = emailTemplates.passwordReset(name || '', resetUrl);
  
  return sendEmail({
    to: email,
    ...template,
  });
}

// Send welcome email
export async function sendWelcomeEmail(
  email: string,
  name: string | null
): Promise<boolean> {
  const template = emailTemplates.welcome(name || '');
  
  return sendEmail({
    to: email,
    ...template,
  });
}
