import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const DEMO_EMAIL_DOMAIN = '@gymsphere.demo';

function isDemoSeededAccount(email: string): boolean {
  return email.trim().toLowerCase().endsWith(DEMO_EMAIL_DOMAIN);
}

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

/** Strip HTML tags for plain-text fallback (improves compatibility) */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
  if (isDemoSeededAccount(to)) {
    console.log(`📧 Skipping email for seeded demo account: ${to}`);
    return;
  }

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
      text: text ?? stripHtml(html),
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw new Error('Failed to send email');
  }
}

/**
 * Shared email layout — dark theme matching app (bg #1e1e1e, red #b91c1c).
 * Uses table-based layout and inline styles for maximum email client compatibility
 * (Gmail, Outlook, Apple Mail, Yahoo, etc.).
 */
function emailLayout(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#1e1e1e;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#1e1e1e;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;">
          <!-- Header -->
          <tr>
            <td style="background-color:#252526;border:1px solid #3c3c3c;border-radius:12px 12px 0 0;padding:24px 28px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;">Gym<span style="color:#b91c1c;">Sphere</span></h1>
              <p style="margin:6px 0 0 0;font-size:13px;color:#a1a1aa;">Elite Fitness</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#252526;border:1px solid #3c3c3c;border-top:none;border-radius:0 0 12px 12px;padding:28px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 16px;">
              <p style="margin:0;font-size:12px;color:#71717a;">© 2026 GymSphere. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Primary CTA button — inline styles for Gmail/Outlook compatibility */
function buttonHtml(text: string, url: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td align="center">
      <a href="${escapeHtml(url)}" style="display:inline-block;background-color:#b91c1c;color:#ffffff !important;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;font-size:15px;">${escapeHtml(text)}</a>
    </td>
  </tr>
</table>`;
}

export function generateVerifyEmailHTML(name: string, verifyUrl: string): string {
  const content = `
<h2 style="margin:0 0 16px 0;font-size:20px;font-weight:bold;color:#ffffff;">Welcome, ${escapeHtml(name)}!</h2>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">
  Thank you for registering with GymSphere. Please verify your email address to activate your account.
</p>
${buttonHtml('Verify Email Address', verifyUrl)}
<p style="margin:0 0 8px 0;font-size:13px;color:#a1a1aa;">
  Or copy this link to your browser:
</p>
<p style="margin:0 0 20px 0;">
  <a href="${escapeHtml(verifyUrl)}" style="color:#b91c1c;font-size:13px;word-break:break-all;">${escapeHtml(verifyUrl)}</a>
</p>
<p style="margin:0;font-size:13px;color:#71717a;">This link will expire in 24 hours.</p>
`;
  return emailLayout('Verify Your Email', content);
}

export function generateResetPasswordHTML(name: string, resetUrl: string): string {
  const content = `
<h2 style="margin:0 0 16px 0;font-size:20px;font-weight:bold;color:#ffffff;">Password Reset Request</h2>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">
  Hi ${escapeHtml(name)},
</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">
  We received a request to reset your password. Click the button below to set a new password:
</p>
${buttonHtml('Reset Password', resetUrl)}
<p style="margin:0 0 8px 0;font-size:13px;color:#a1a1aa;">
  Or copy this link to your browser:
</p>
<p style="margin:0 0 20px 0;">
  <a href="${escapeHtml(resetUrl)}" style="color:#b91c1c;font-size:13px;word-break:break-all;">${escapeHtml(resetUrl)}</a>
</p>
<p style="margin:0 0 8px 0;font-size:13px;color:#71717a;">This link will expire in 1 hour.</p>
<p style="margin:0;font-size:13px;color:#71717a;">If you didn't request this, please ignore this email.</p>
`;
  return emailLayout('Reset Your Password', content);
}

export function generateIdVerificationHTML(
  name: string,
  status: 'approved' | 'rejected',
  note?: string | null,
): string {
  const isApproved = status === 'approved';
  const content = `
<h2 style="margin:0 0 16px 0;font-size:20px;font-weight:bold;color:#ffffff;">
  Identity Verification ${isApproved ? 'Approved' : 'Update'}
</h2>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">
  Hi ${escapeHtml(name)},
</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">
  ${isApproved
    ? 'Your identity has been verified. Welcome to GymSphere! You now have full access to all member features.'
    : `Your identity verification was not approved.${note ? ` Reason: ${escapeHtml(note)}` : ''} Please re-upload your documents via the app.`}
</p>
${isApproved ? '' : `<p style="margin:0;font-size:14px;color:#a1a1aa;">Log in to your account to resubmit your documents.</p>`}
`;
  return emailLayout('Identity Verification', content);
}

export function generateInvoiceEmailHTML(input: {
  invoiceNumber: string;
  memberName: string;
  planName: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  receiptNumber: string;
  referenceNumber: string;
}): string {
  const content = `
<h2 style="margin:0 0 16px 0;font-size:20px;font-weight:bold;color:#ffffff;">Payment Receipt & Invoice</h2>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">
  Hi ${escapeHtml(input.memberName)},
</p>
<p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;color:#d4d4d8;">
  Your payment was processed successfully. Here are your invoice details:
</p>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #3c3c3c;border-radius:12px;overflow:hidden;">
  <tr>
    <td style="padding:14px 16px;background-color:#1f1f20;border-bottom:1px solid #3c3c3c;">
      <p style="margin:0;font-size:13px;color:#a1a1aa;">Invoice</p>
      <p style="margin:4px 0 0 0;font-size:16px;font-weight:bold;color:#ffffff;">${escapeHtml(input.invoiceNumber)}</p>
    </td>
    <td style="padding:14px 16px;background-color:#1f1f20;border-bottom:1px solid #3c3c3c;text-align:right;">
      <p style="margin:0;font-size:13px;color:#a1a1aa;">Amount</p>
      <p style="margin:4px 0 0 0;font-size:16px;font-weight:bold;color:#ffffff;">$${Number(input.amount || 0).toLocaleString('en-US')}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:14px 16px;">
      <p style="margin:0;font-size:13px;color:#a1a1aa;">Plan</p>
      <p style="margin:4px 0 0 0;font-size:14px;color:#ffffff;">${escapeHtml(input.planName)}</p>
    </td>
    <td style="padding:14px 16px;text-align:right;">
      <p style="margin:0;font-size:13px;color:#a1a1aa;">Date</p>
      <p style="margin:4px 0 0 0;font-size:14px;color:#ffffff;">${escapeHtml(input.paymentDate)}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:14px 16px;border-top:1px solid #3c3c3c;">
      <p style="margin:0;font-size:13px;color:#a1a1aa;">Receipt</p>
      <p style="margin:4px 0 0 0;font-size:14px;color:#ffffff;">${escapeHtml(input.receiptNumber)}</p>
    </td>
    <td style="padding:14px 16px;border-top:1px solid #3c3c3c;text-align:right;">
      <p style="margin:0;font-size:13px;color:#a1a1aa;">Reference</p>
      <p style="margin:4px 0 0 0;font-size:14px;color:#ffffff;">${escapeHtml(input.referenceNumber)}</p>
    </td>
  </tr>
</table>

<p style="margin:18px 0 0 0;font-size:13px;color:#71717a;">
  You can also download the invoice from your payment history in the app.
</p>
`;
  return emailLayout(`Invoice ${input.invoiceNumber}`, content);
}
