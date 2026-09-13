// utils/emailService.js
require('dotenv').config();

const BREVO_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';

const ensureConfigured = () => {
  if (!process.env.BREVO_API_KEY) {
    console.error('BREVO_API_KEY environment variable is missing');
    throw new Error('Email configuration is incomplete');
  }
  if (!process.env.BREVO_FROM) {
    console.error('BREVO_FROM environment variable is missing');
    throw new Error('Email configuration is incomplete');
  }
};

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const attachmentContent = (content) => {
  if (Buffer.isBuffer(content)) return content.toString('base64');
  if (typeof content === 'string') return content;
  throw new Error('Email attachments must contain a Buffer or base64 string');
};

// Sends all transactional emails through Brevo's HTTPS API. Attachments use
// the same { filename, content } shape expected by the existing callers.
const sendEmail = async (to, subject, text, attachments = []) => {
  ensureConfigured();
  console.log(`Sending email to ${to} with subject "${subject}"`);

  const payload = {
    sender: {
      name: 'Student Facility System',
      email: process.env.BREVO_FROM,
    },
    to: [{ email: to }],
    subject,
    textContent: text,
    htmlContent: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4a5568;">Student Facility System</h2>
      <p>${escapeHtml(text).replace(/\r?\n/g, '<br>')}</p>
      <p style="margin-top: 20px; font-size: 12px; color: #718096;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>`,
  };

  if (attachments.length > 0) {
    payload.attachment = attachments.map((attachment) => ({
      name: attachment.filename,
      content: attachmentContent(attachment.content),
    }));
  }

  try {
    const response = await fetch(BREVO_EMAIL_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(responseBody.message || `Brevo email request failed (${response.status})`);
    }

    console.log('Email sent successfully. Message ID:', responseBody.messageId);
    return { success: true, messageId: responseBody.messageId };
  } catch (error) {
    const message = error.name === 'TimeoutError'
      ? 'Brevo email request timed out'
      : error.message;
    console.error('Error sending email:', message);
    throw new Error(message || 'Failed to send email');
  }
};

module.exports = sendEmail;
