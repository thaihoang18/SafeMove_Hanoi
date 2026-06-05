/**
 * email-service.mjs
 * Email notifications via Mailtrap API or nodemailer (SMTP).
 * Prefers Mailtrap API when MAILTRAP_API_TOKEN is present so it works on
 * platforms that block outbound SMTP, such as Render free web services.
 *
 * Mailtrap API setup:
 *   1. Verify your sending domain in Mailtrap.
 *   2. Add to env:
 *      MAILTRAP_API_TOKEN=...
 *      MAILTRAP_FROM=SafeMove HaNoi <noreply@your-verified-domain.com>
 *
 * SMTP fallback setup:
 *   1. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 */

import nodemailer from "nodemailer";

let transporter = null;
const SMTP_TIMEOUT_MS = 15000;
const SEND_MAIL_TIMEOUT_MS = 20000;
const MAILTRAP_SEND_URL = "https://send.api.mailtrap.io/api/send";

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

function parseFromAddress(value) {
  const raw = value?.trim();
  if (!raw) return null;

  const match = raw.match(/^(.*?)<([^<>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/["']/g, "");
    const email = match[2].trim();
    return { email, ...(name ? { name } : {}) };
  }

  return { email: raw };
}

function getMailtrapConfig() {
  const token = process.env.MAILTRAP_API_TOKEN?.trim() || process.env.MAILTRAP_TOKEN?.trim();
  if (!token) return null;

  const from = parseFromAddress(process.env.MAILTRAP_FROM?.trim() || process.env.SMTP_FROM?.trim());
  if (!from?.email) {
    return { token, from: null };
  }

  return { token, from };
}

async function sendViaMailtrap(to, subject, htmlBody, textBody) {
  const config = getMailtrapConfig();
  if (!config?.token) return null;
  if (!config.from?.email) {
    return { sent: false, error: "mailtrap_from_not_configured" };
  }

  const response = await withTimeout(
    fetch(MAILTRAP_SEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [{ email: to }],
        subject,
        text: textBody ?? htmlBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        html: htmlBody,
      }),
    }),
    SEND_MAIL_TIMEOUT_MS,
    "Mailtrap send",
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Mailtrap API failed with ${response.status}${errorBody ? `: ${errorBody}` : ""}`,
    );
  }

  return { sent: true, error: null };
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
  const mailtrapResult = await sendViaMailtrap(to, subject, htmlBody, textBody);
  if (mailtrapResult) {
    return mailtrapResult;
  }

  const t = getTransporter();
  if (!t) {
    console.warn("[Email] No Mailtrap token or SMTP settings — email skipped.");
    return { sent: false, error: "email_not_configured" };
  }

  const from = process.env.SMTP_FROM?.trim();
  if (!from) {
    return { sent: false, error: "smtp_from_not_configured" };
  }

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
