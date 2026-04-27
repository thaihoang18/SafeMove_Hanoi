import { sql } from "../db.mjs";
import { hashPassword } from "../utils/security.mjs";
import { assert, isNonEmptyString, toNullableNumber, toNullableString } from "../utils/validation.mjs";

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

  return { user };
}

export async function loginUserController(body) {
  assert(isNonEmptyString(body.email), "email is required.");
  assert(isNonEmptyString(body.password), "password is required.");

  const email = body.email.trim().toLowerCase();
  const passwordHash = await hashPassword(body.password);

  const rows = await sql`
    select id, email, full_name, birth_year, home_lat, home_lng, created_at
    from airpath.users
    where email = ${email}
      and password_hash = ${passwordHash}
    limit 1
  `;

  if (!rows[0]) {
    throw new Error("Invalid email or password.");
  }

  return { user: rows[0] };
}

