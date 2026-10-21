import nodemailer from "nodemailer";
import env from "../config/env.js";
import logger from "../config/logger.js";

const isConfigured = Boolean(env.smtp.user && env.smtp.pass);

let transporter = null;

if (isConfigured) {
  const smtpPort = parseInt(env.smtp.port || "465", 10);

  transporter = nodemailer.createTransport({
    host: env.smtp.host || "smtp.gmail.com",
    port: smtpPort,
    secure: smtpPort === 465, // true for 465 (SSL), false for 587 (STARTTLS)
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents local ISP SSL handshake drops
    },
    connectionTimeout: 30000, // 30 seconds
    socketTimeout: 45000, // 45 seconds
  });
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordResetEmail({ to, resetUrl }) {
  if (!isConfigured || !transporter) {
    const message = "SMTP is not configured; password reset email could not be sent";
    logger.error({ to, resetUrl }, message);
    throw new Error(message);
  }

  const mailOptions = {
    from: env.smtp.from || `"Rovia" <${env.smtp.user}>`,
    to,
    subject: "Reset Your Rovia Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; }
            .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e5e7eb; }
            .logo { font-size: 24px; font-weight: 700; color: #16a34a; margin-bottom: 24px; }
            h2 { color: #111827; font-size: 20px; margin-top: 0; }
            p { color: #374151; font-size: 15px; line-height: 1.6; }
            .button-table { margin: 28px auto; border-collapse: separate; }
            .button { background-color: #16a34a; border-radius: 6px; display: inline-block; padding: 14px 32px; text-align: center; text-decoration: none; }
            .button span { color: #ffffff !important; font-weight: 600; font-size: 15px; }
            .link-text { font-size: 13px; color: #6b7280; word-break: break-all; }
            .link-text a { color: #16a34a; }
            .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Rovia</div>
            <h2>Password Reset Request</h2>
            <p>We received a request to reset the password for your Rovia account.</p>
            <p>Click the button below to set a new password. For security reasons, this link will expire in <strong>1 hour</strong>.</p>
            
            <table class="button-table" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td class="button">
                  <a href="${resetUrl}" target="_blank" style="text-decoration: none;">
                    <span>Reset Password</span>
                  </a>
                </td>
              </tr>
            </table>

            <p class="link-text">If the button doesn't work, copy and paste this link into your browser:<br><a href="${resetUrl}">${resetUrl}</a></p>
            <p style="font-size: 13px; color: #6b7280;">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Rovia Technologies. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({ to }, "Password reset email delivered successfully");
  } catch (error) {
    logger.error(
      { err: error.message, to, resetUrl },
      "Failed to send password reset email via SMTP",
    );
    throw new Error("Failed to send password reset email via SMTP");
  }
}

/**
 * Send Email Verification Email
 */
export async function sendVerificationEmail({
  to,
  firstName,
  verificationUrl,
}) {
  if (!isConfigured || !transporter) {
    const message = "SMTP is not configured; verification email could not be sent";
    logger.error({ to, verificationUrl }, message);
    throw new Error(message);
  }

  const mailOptions = {
    from: env.smtp.from || `"Rovia" <${env.smtp.user}>`,
    to,
    subject: "Verify Your Rovia Email Address",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; }
            .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e5e7eb; }
            .logo { font-size: 24px; font-weight: 700; color: #16a34a; margin-bottom: 24px; }
            h2 { color: #111827; font-size: 20px; margin-top: 0; }
            p { color: #374151; font-size: 15px; line-height: 1.6; }
            .button-table { margin: 28px auto; border-collapse: separate; }
            .button { background-color: #16a34a; border-radius: 6px; display: inline-block; padding: 14px 32px; text-align: center; text-decoration: none; }
            .button span { color: #ffffff !important; font-weight: 600; font-size: 15px; }
            .link-text { font-size: 13px; color: #6b7280; word-break: break-all; }
            .link-text a { color: #16a34a; }
            .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Rovia</div>
            <h2>Welcome to Rovia${firstName ? `, ${firstName}` : ""}!</h2>
            <p>Thanks for creating an account. Please verify your email address to confirm your registration.</p>
            <p>This verification link will expire in <strong>24 hours</strong>.</p>
            
            <table class="button-table" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td class="button">
                  <a href="${verificationUrl}" target="_blank" style="text-decoration: none;">
                    <span>Verify Email Address</span>
                  </a>
                </td>
              </tr>
            </table>

            <p class="link-text">If the button doesn't work, copy and paste this link into your browser:<br><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p style="font-size: 13px; color: #6b7280;">If you did not create an account on Rovia, you can safely ignore this email.</p>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Rovia Technologies. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({ to }, "Verification email delivered successfully");
  } catch (error) {
    logger.error(
      { err: error.message, to, verificationUrl },
      "Failed to send verification email via SMTP",
    );
  }
}
