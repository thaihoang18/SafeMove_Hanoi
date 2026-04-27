import { sql } from "../db.mjs";
import { assert, isNonEmptyString, toNullableString } from "../utils/validation.mjs";

export async function listLocationsController(searchParams) {
  const city = toNullableString(searchParams.get("city"));
  const district = toNullableString(searchParams.get("district"));
  const type = toNullableString(searchParams.get("type"));

  const locations = await sql`
    select id, name, location_type, city, district, address, lat, lng, created_at
    from airpath.locations
    where (${city}::text is null or city = ${city})
      and (${district}::text is null or district = ${district})
      and (${type}::text is null or location_type = ${type})
    order by city asc nulls last, district asc nulls last, name asc
    limit 100
  `;

  return { locations };
}

export async function createLocationController(body) {
  assert(isNonEmptyString(body.name), "name is required.");
  assert(isNonEmptyString(body.locationType), "locationType is required.");

  const [location] = await sql`
    insert into airpath.locations (
      name,
      location_type,
      city,
      district,
      address,
      lat,
      lng
    ) values (
      ${body.name.trim()},
      ${body.locationType.trim()},
      ${toNullableString(body.city)},
      ${toNullableString(body.district)},
      ${toNullableString(body.address)},
      ${Number(body.lat)},
      ${Number(body.lng)}
    )
    returning *
  `;

  return { location };
}

