import { sql } from "../db.mjs";
import { generateTemporaryPassword, hashPassword } from "../utils/security.mjs";
import { assert, isNonEmptyString, toNullableNumber, toNullableString } from "../utils/validation.mjs";
import { sendEmail } from "../services/email-service.mjs";

function getAdminCredentials() {
  const username = (process.env.ADMIN_USERNAME ?? "admin").trim().toLowerCase();
  return {
    username,
    email: `${username}@safemove.hanoi`,
    password: process.env.ADMIN_PASSWORD ?? "adminsmhn",
  };
}

async function buildAdminUser() {
  const username = getAdminCredentials().username;

  return {
    id: "admin",
    email: username,
    full_name: "管理者",
    birth_year: null,
    home_lat: null,
    home_lng: null,
    role: "admin",
  };
}

export async function registerUserController(body) {
  assert(isNonEmptyString(body.email), "email is required.");
  assert(isNonEmptyString(body.password), "password is required.");

  const email = body.email.trim().toLowerCase();
  const passwordHash = await hashPassword(body.password);
  const fullName = toNullableString(body.fullName);
  const birthYear = toNullableNumber(body.birthYear);
  const homeLat = toNullableNumber(body.homeLat);
  const homeLng = toNullableNumber(body.homeLng);

  const [user] = await sql`
    insert into airpath.users (
      email,
      password_hash,
      full_name,
      birth_year,
      home_lat,
      home_lng
    ) values (
      ${email},
      ${passwordHash},
      ${fullName},
      ${birthYear},
      ${homeLat},
      ${homeLng}
    )
    returning id, email, full_name, birth_year, home_lat, home_lng, created_at
  `;

  await sql`
    insert into airpath.user_profiles (user_id)
    values (${user.id})
    on conflict (user_id) do nothing
  `;

  await sql`
    insert into airpath.notification_preferences (user_id)
    values (${user.id})
    on conflict (user_id) do nothing
  `;

  return { user: { ...user, role: "user" } };
}

export async function loginUserController(body) {
  assert(isNonEmptyString(body.email), "email is required.");
  assert(isNonEmptyString(body.password), "password is required.");

  const identifier = body.email.trim().toLowerCase();
  const passwordHash = await hashPassword(body.password);
  const adminCredentials = getAdminCredentials();
  const expectedRole = body.expectedRole === "admin" || body.expectedRole === "user" ? body.expectedRole : null;

  if (identifier === adminCredentials.username || identifier === adminCredentials.email) {
    const adminPasswordHash = await hashPassword(adminCredentials.password);

    if (passwordHash !== adminPasswordHash) {
      throw new Error("Invalid admin credentials.");
    }

    if (expectedRole === "user") {
      throw new Error("Admin account cannot log in from the user login screen.");
    }

    return { user: await buildAdminUser() };
  }

  const rows = await sql`
    select id, email, full_name, birth_year, home_lat, home_lng, created_at
    from airpath.users
    where (email = ${identifier} or lower(full_name) = lower(${identifier}) or email like ${identifier + '@%'})
      and password_hash = ${passwordHash}
    order by (email = ${identifier}) desc, (lower(full_name) = lower(${identifier})) desc
    limit 1
  `;

  if (!rows[0]) {
    throw new Error("Invalid email or password.");
  }

  if (expectedRole === "admin") {
    throw new Error("User account cannot log in from the admin login screen.");
  }

  return { user: { ...rows[0], role: "user" } };
}

export async function resetPasswordController(body) {
  assert(isNonEmptyString(body.email), "email is required.");

  const email = body.email.trim().toLowerCase();
  const rows = await sql`
    select id, email, full_name, password_hash
    from airpath.users
    where email = ${email}
    limit 1
  `;

  if (!rows[0]) {
    return {
      reset: true,
      emailSent: true,
      message: "メールアドレスが登録済みの場合は、新しいパスワードを送信しました。",
    };
  }

  const user = rows[0];
  const temporaryPassword = generateTemporaryPassword(12);
  const temporaryPasswordHash = await hashPassword(temporaryPassword);

  await sql`
    update airpath.users
    set password_hash = ${temporaryPasswordHash}
    where id = ${user.id}
  `;

  const displayName = user.full_name?.trim() || user.email;
  const subject = "[SafeMove Hanoi] 新しいパスワードのお知らせ";
  const htmlBody = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;background:#f3f7f4;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border:1px solid #dbe7de;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(17,120,67,0.08);">
      <div style="padding:24px 28px;background:linear-gradient(135deg,#117843,#0d5a2c);color:#ffffff;">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">SafeMove Hanoi</div>
        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;">新しいパスワードを作成しました</h1>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">${displayName} 様</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">SafeMove Hanoi のアカウントに対するパスワード再設定のご依頼を受け付けました。</p>
        <div style="margin:24px 0;padding:18px 20px;border-radius:16px;background:#f7faf8;border:1px dashed #a8c9b4;">
          <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#117843;margin-bottom:8px;font-weight:700;">新しいパスワード</div>
          <div style="font-size:28px;font-weight:700;letter-spacing:0.08em;color:#0f3d24;">${temporaryPassword}</div>
        </div>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">このパスワードで今すぐログインできます。ログイン後は、より安全のためご自身のパスワードへ変更してください。</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;">パスワード再設定をご依頼いただいていない場合は、このメールを無視してください。後ほど再度ログインしてアカウントをご確認いただけます。</p>
      </div>
      <div style="padding:16px 28px;border-top:1px solid #e5efe7;background:#fbfdfb;font-size:12px;line-height:1.6;color:#6b7280;">
        このメールは SafeMove Hanoi から自動送信されています。
      </div>
    </div>
  </div>
</body>
</html>`;

  const textBody = [
    "SafeMove Hanoi - 新しいパスワードのお知らせ",
    `${displayName} 様`,
    "アカウント用の新しいパスワードを作成しました。",
    `新しいパスワード: ${temporaryPassword}`,
    "このパスワードで今すぐログインできます。ログイン後は、ご自身のパスワードへ変更してください。",
  ].join("\n\n");

  const result = await sendEmail(email, subject, htmlBody, textBody);

  if (!result.sent) {
    await sql`
      update airpath.users
      set password_hash = ${user.password_hash}
      where id = ${user.id}
    `;

    throw new Error("パスワード再設定メールを送信できませんでした。しばらくしてからもう一度お試しください。");
  }

  return {
    reset: true,
    emailSent: true,
    message: "新しいパスワードをメールで送信しました。",
  };
}
