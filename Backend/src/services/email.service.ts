import nodemailer from 'nodemailer';
import logger from '../config/logger';

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.zoho.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'; // Usually true for port 465
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || '"PowerWorld Gyms" <noreply@powerworld.lk>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
    },
});

export class EmailService {
    // Verify connection configuration
    static async verifyConnection(): Promise<boolean> {
        try {
            await transporter.verify();
            logger.info('Email service is ready');
            return true;
        } catch (error) {
            logger.error('Email service connection failed:', error);
            return false;
        }
    }

    // Send Verification Email
    static async sendVerificationEmail(to: string, token: string): Promise<boolean> {
        const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4F46E5; text-align: center;">Verify Your Email Address</h2>
                <p>Hello,</p>
                <p>Thank you for registering with PowerWorld Gyms. Please click the button below to verify your email address and activate your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
                </div>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p><a href="${verificationUrl}" style="color: #4F46E5;">${verificationUrl}</a></p>
                <p>This link will expire in 24 hours.</p>
                <p>Best regards,<br>PowerWorld Gyms Team</p>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: EMAIL_FROM,
                to,
                subject: 'PowerWorld Gyms - Verify Your Email',
                html,
            });
            logger.info(`Verification email sent to ${to}`);
            return true;
        } catch (error) {
            logger.error(`Failed to send verification email to ${to}:`, error);
            return false;
        }
    }

    // Send Password Reset Email
    static async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
        const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4F46E5; text-align: center;">Reset Your Password</h2>
                <p>Hello,</p>
                <p>You requested a password reset. Click the button below to create a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                </div>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p><a href="${resetUrl}" style="color: #4F46E5;">${resetUrl}</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request a password reset, please ignore this email.</p>
                <p>Best regards,<br>PowerWorld Gyms Team</p>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: EMAIL_FROM,
                to,
                subject: 'PowerWorld Gyms - Password Reset Request',
                html,
            });
            logger.info(`Password reset email sent to ${to}`);
            return true;
        } catch (error) {
            logger.error(`Failed to send password reset email to ${to}:`, error);
            return false;
        }
    }
}
