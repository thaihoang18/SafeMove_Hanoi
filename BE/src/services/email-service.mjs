/**
 * email-service.mjs
 * Email notifications via nodemailer (SMTP).
 * Works with Gmail App Password, SendGrid SMTP, Mailgun, etc.
 *
 * Setup (Gmail example):
 *   1. Enable 2FA on your Google account
 *   2. Go to https://myaccount.google.com/apppasswords → create App Password
 *   3. Add to .env:
 *      SMTP_HOST=smtp.gmail.com
 *      SMTP_PORT=587
 *      SMTP_USER=you@gmail.com
 *      SMTP_PASS=your-app-password
 *      SMTP_FROM=SafeMove HaNoi <you@gmail.com>
 */

import nodemailer from "nodemailer";

let transporter = null;
const SMTP_TIMEOUT_MS = 15000;
const SEND_MAIL_TIMEOUT_MS = 20000;

function withTimeout(promise, timeoutMs, label) {
  let timerId;

  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      const error = new Error(`${label} timed out after ${timeoutMs}ms`);
      error.code = "EMAIL_TIMEOUT";
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timerId) {
      clearTimeout(timerId);
    }
  });
}

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    auth: { user, pass },
    tls: {
      // Reject unauthorized certs in production; allow in dev if needed
      rejectUnauthorized: process.env.NODE_ENV === "production",
      minVersion: "TLSv1.2",
    },
  });

  return transporter;
}

/**
 * Send an HTML email.
 * @param {string} to - Recipient email address
 * @param {string} subject
 * @param {string} htmlBody - HTML email body
 * @param {string} [textBody] - Plain text fallback
 * @returns {{ sent: boolean, error: string|null }}
 */
export async function sendEmail(to, subject, htmlBody, textBody) {
  const t = getTransporter();
  if (!t) {
    console.warn("[Email] SMTP not configured — email skipped.");
    return { sent: false, error: "smtp_not_configured" };
  }

  const from = process.env.SMTP_FROM?.trim() || "SafeMove HaNoi <noreply@safemove.local>";

  try {
    await withTimeout(
      t.sendMail({
        from,
        to,
        subject,
        html: htmlBody,
        text: textBody ?? htmlBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      }),
      SEND_MAIL_TIMEOUT_MS,
      "SMTP sendMail",
    );
    return { sent: true, error: null };
  } catch (error) {
    console.error("[Email] sendMail error:", error.message);
    return { sent: false, error: error.message };
  }
}

/**
 * Build a styled AQI alert email HTML body.
 */
export function buildAqiAlertEmailHtml({ title, body, aqi, aqiLabel, location, userName }) {
  const color = aqi !== null && aqi > 150 ? "#dc2626" : aqi > 100 ? "#f59e0b" : "#10b981";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:${color};padding:24px 28px;color:white;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.15em;opacity:0.85;">SafeMove HaNoi · Cảnh báo AQI</div>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;">${title}</h1>
    </div>
    <div style="padding:24px 28px;">
      ${aqi !== null ? `<div style="text-align:center;padding:16px;background:#f8fafc;border-radius:12px;margin-bottom:20px;">
        <div style="font-size:56px;font-weight:700;color:${color};">${aqi}</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">AQI · ${aqiLabel ?? ""}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:2px;">📍 ${location ?? ""}</div>
      </div>` : ""}
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 20px;">${body}</p>
      <a href="#" style="display:inline-block;background:${color};color:white;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;">Xem chi tiết trong ứng dụng</a>
    </div>
    <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
      Xin chào ${userName ?? "bạn"} — bạn nhận email này vì đã đăng ký nhận cảnh báo AQI từ SafeMove HaNoi.
    </div>
  </div>
</body>
</html>`;
}
