// scripts/send-test-email.js
const { transporter, sendEmail } = require("../server/services/mailer");

(async () => {
  // 1) Verify SMTP creds + TLS
  await new Promise((res, rej) =>
    transporter.verify((err) => (err ? rej(err) : res())),
  );

  // 2) Send to yourself first
  const id = await sendEmail({
    to: process.env.SMTP_USER, // lastminute@villatokay.com
    subject: "Test • Villa Tokay (lastminute)",
    html: "<p>If you see this, SMTP works ✅</p>",
  });

  console.log("Sent! messageId =", id);
})().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
