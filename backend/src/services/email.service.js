import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@hireflow.com';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const isSmtpConfigured = SMTP_HOST && SMTP_USER && SMTP_PASS;

let transporter = null;

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  logger.info('Nodemailer SMTP transporter initialized');
} else {
  logger.warn('SMTP configuration missing in environment. Email service will run in local mock/console-log mode.');
}

/**
 * Send an email. Falls back to console logging if Nodemailer is not configured.
 */
const sendMail = async ({ to, subject, html, text }) => {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        html,
        text,
      });
      logger.info(`Email sent successfully: ${info.messageId} to ${to}`);
      return info;
    } catch (err) {
      logger.error(`Error sending email to ${to}: ${err.message}`);
      // Don't throw the error, just swallow it and log, so it doesn't interrupt the business flow
    }
  } else {
    logger.info(`
[MOCK EMAIL SENT]
========================================
To:      ${to}
Subject: ${subject}
Text:    ${text}
========================================
    `);
  }
};

/**
 * Send welcome email with verification link.
 */
export const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${CLIENT_URL}/verify-email?token=${token}`;
  
  const subject = 'Welcome to HireFlow! Verify your email';
  const text = `Hello ${user.name},\n\nWelcome to HireFlow! Please verify your email by clicking this link: ${verificationUrl}\n\nThis link will expire in 24 hours.`;
  const html = `
    <div style="font-family: 'Outfit', 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to HireFlow!</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello ${user.name},</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">Thank you for registering on HireFlow. Please confirm your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Verify Email Address</a>
      </div>
      <p style="color: #64748b; font-size: 14px; line-height: 1.5;">If the button above does not work, copy and paste this URL into your browser:</p>
      <p style="color: #4f46e5; font-size: 14px; word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">This link will expire in 24 hours. If you did not create this account, you can safely ignore this email.</p>
    </div>
  `;

  await sendMail({ to: user.email, subject, html, text });
};

/**
 * Send password reset link email.
 */
export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;
  
  const subject = 'HireFlow — Password Reset Request';
  const text = `Hello ${user.name},\n\nYou requested a password reset. Please click this link to reset your password: ${resetUrl}\n\nThis link is valid for 1 hour. If you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family: 'Outfit', 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello ${user.name},</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">We received a request to reset the password for your HireFlow account. Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 600; border-radius: 8px; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 14px; line-height: 1.5;">If the button above does not work, copy and paste this URL into your browser:</p>
      <p style="color: #4f46e5; font-size: 14px; word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">This link will expire in 1 hour. If you did not request this change, you can safely ignore this email and your password will remain secure.</p>
    </div>
  `;

  await sendMail({ to: user.email, subject, html, text });
};

/**
 * Send email confirmation when an application is successfully received.
 */
export const sendApplicationReceivedEmail = async (applicant, job) => {
  const subject = `Application Received: ${job.title}`;
  const text = `Hello ${applicant.name},\n\nWe have received your application for the position of "${job.title}" at HireFlow. The hiring team has been notified.\n\nYou can track the progress of your application on your dashboard.`;
  const html = `
    <div style="font-family: 'Outfit', 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #10b981; margin-bottom: 16px;">Application Received!</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello ${applicant.name},</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your application for <strong>${job.title}</strong> has been successfully submitted!</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">The hiring team will review your resume, and you will receive email updates if your application status changes. You can also view the status at any time in your applicant dashboard.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">Thank you for using HireFlow!</p>
    </div>
  `;

  await sendMail({ to: applicant.email, subject, html, text });
};

/**
 * Send email notification when application status changes.
 */
export const sendApplicationStatusEmail = async (applicant, job, status) => {
  const subject = `Application Update: ${job.title}`;
  
  let statusMessage = '';
  let color = '#4f46e5'; // Indigo default

  switch (status) {
    case 'reviewed':
      statusMessage = 'Your application has been reviewed by the hiring manager.';
      color = '#3b82f6'; // Blue
      break;
    case 'shortlisted':
      statusMessage = 'Congratulations! You have been shortlisted for this role. The team will reach out to you shortly for the next steps.';
      color = '#8b5cf6'; // Purple
      break;
    case 'rejected':
      statusMessage = 'Thank you for your interest. Unfortunately, the company has decided to move forward with other candidates at this time. We encourage you to apply for other roles!';
      color = '#ef4444'; // Red
      break;
    case 'hired':
      statusMessage = 'Congratulations! You have been hired for this role! 🎉 The recruitment team will contact you with the onboarding offer details.';
      color = '#10b981'; // Green
      break;
    default:
      statusMessage = `Your application status has been updated to "${status}".`;
  }

  const text = `Hello ${applicant.name},\n\nThere is an update on your application for "${job.title}":\n\n${statusMessage}\n\nLog in to your dashboard to see details.`;
  const html = `
    <div style="font-family: 'Outfit', 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: ${color}; margin-bottom: 16px;">Application Update</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello ${applicant.name},</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your application for <strong>${job.title}</strong> has a new update:</p>
      <div style="background-color: #f8fafc; border-left: 4px solid ${color}; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="color: #0f172a; font-weight: 500; font-size: 16px; margin: 0; line-height: 1.5;">${statusMessage}</p>
      </div>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">You can log in to your candidate dashboard to view the full history and timeline of your applications.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">Thank you for using HireFlow!</p>
    </div>
  `;

  await sendMail({ to: applicant.email, subject, html, text });
};
