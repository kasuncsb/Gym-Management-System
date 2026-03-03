import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Create reusable transporter
const transporter = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    })
  : null;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    console.warn(`📧 Email would be sent to ${to}: ${subject}`);
    console.warn(`Email service not configured (SMTP_* env vars missing)`);
    return;
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw new Error('Failed to send email');
  }
}

export function generateVerifyEmailHTML(name: string, verifyUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">PowerWorld Gyms</h1>
      </div>
      <div class="content">
        <h2>Welcome, ${name}!</h2>
        <p>Thank you for registering with PowerWorld Gyms. Please verify your email address to activate your account.</p>
        <center>
          <a href="${verifyUrl}" class="button">Verify Email Address</a>
        </center>
        <p style="color: #6b7280; font-size: 14px;">Or copy this link to your browser:<br>
        <a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
      </div>
      <div class="footer">
        <p>PowerWorld Gyms | Transform Your Fitness Journey</p>
      </div>
    </body>
    </html>
  `;
}

export function generateResetPasswordHTML(name: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">PowerWorld Gyms</h1>
      </div>
      <div class="content">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <center>
          <a href="${resetUrl}" class="button">Reset Password</a>
        </center>
        <p style="color: #6b7280; font-size: 14px;">Or copy this link to your browser:<br>
        <a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
      <div class="footer">
        <p>PowerWorld Gyms | Transform Your Fitness Journey</p>
      </div>
    </body>
    </html>
  `;
}
