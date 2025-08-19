// server/services/mailer.js  (CommonJS)
const nodemailer = require('nodemailer');

const secure = String(process.env.SMTP_PORT || '') === '465'; // 465 => SSL/TLS

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,              // mail.infomaniak.com
  port: Number(process.env.SMTP_PORT || 465),
  secure,                                   // true for 465, false for 587
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendEmail({ to, subject, html, cc, bcc, replyTo }) {
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,            // "Villa Tokay <lastminute@villatokay.com>"
    to,
    cc,
    bcc,
    replyTo: replyTo || process.env.REPLY_TO, // "info@villatokay.com"
    subject,
    html,
  });
  return info.messageId || null;
}

module.exports = { transporter, sendEmail };