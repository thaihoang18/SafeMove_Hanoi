import { sql } from "../db.mjs";
import { hashPassword } from "../utils/security.mjs";
import { assert, isNonEmptyString, toNullableNumber, toNullableString } from "../utils/validation.mjs";

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
    full_name: "Quản trị viên",
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

  if (identifier === adminCredentials.username || identifier === adminCredentials.email) {
    const adminPasswordHash = await hashPassword(adminCredentials.password);

    if (passwordHash !== adminPasswordHash) {
      throw new Error("Invalid admin credentials.");
    }

    return { user: await buildAdminUser() };
  }

  const rows = await sql`
    select id, email, full_name, birth_year, home_lat, home_lng, created_at
    from airpath.users
    where email = ${identifier}
      and password_hash = ${passwordHash}
    limit 1
  `;

  if (!rows[0]) {
    throw new Error("Invalid email or password.");
  }

  return { user: { ...rows[0], role: "user" } };
}

