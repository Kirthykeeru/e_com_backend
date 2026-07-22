const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

const sendNewOrderEmail = async ({ orderId, buyerName, buyerEmail, total }) => {
  if (!transporter) {
    console.log(`[mailer] SMTP not configured; skipping email notification for order #${orderId}`);
    return;
  }

  const recipients = (process.env.ADMIN_NOTIFY_EMAIL || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    console.log('[mailer] ADMIN_NOTIFY_EMAIL not set; skipping email notification');
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: recipients.join(','),
      subject: `New order #${orderId} - $${total.toFixed(2)}`,
      text: `New order #${orderId} placed by ${buyerName} (${buyerEmail}) for $${total.toFixed(2)}.`,
    });
  } catch (err) {
    console.error('[mailer] Failed to send new order email:', err.message);
  }
};

module.exports = { sendNewOrderEmail };
