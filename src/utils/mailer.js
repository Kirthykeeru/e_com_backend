const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

async function sendNewOrderEmail({ orderId, buyerName, buyerEmail, total }) {
  if (!transporter || !process.env.ADMIN_NOTIFY_EMAIL) {
    console.log(`[mailer] SMTP not configured; skipping email notification for order #${orderId}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@electric-shop.example',
      to: process.env.ADMIN_NOTIFY_EMAIL,
      subject: `New order #${orderId}`,
      text: `New order #${orderId} placed by ${buyerName} (${buyerEmail}) for a total of $${total}.`,
    });
  } catch (err) {
    console.error(`[mailer] Failed to send new-order email for order #${orderId}:`, err.message);
  }
}

module.exports = { sendNewOrderEmail };
