import { sql } from "../db.mjs";
import { assert, isNonEmptyString, toNullableString } from "../utils/validation.mjs";

export async function listLocationsController(searchParams) {
  const city = toNullableString(searchParams.get("city"));
  const district = toNullableString(searchParams.get("district"));
  const type = toNullableString(searchParams.get("type"));

  const locations = await sql`
    select
      l.id,
      l.name,
      l.location_type,
      l.city,
      l.district,
      l.address,
      l.lat,
      l.lng,
      l.created_at,
      nearest_aqi.aqi as aqi_level
    from airpath.locations l
    left join lateral (
      select m.aqi
      from airpath.aqi_measurements m
      join airpath.locations ml on ml.id = m.location_id
      order by
        power(ml.lat - l.lat, 2) + power(ml.lng - l.lng, 2),
        m.measured_at desc
      limit 1
    ) nearest_aqi on true
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

export async function updateLocationController(locationId, body) {
  assert(isNonEmptyString(body.name), "name is required.");
  assert(isNonEmptyString(body.locationType), "locationType is required.");

  const [location] = await sql`
    update airpath.locations
    set
      name = ${body.name.trim()},
      location_type = ${body.locationType.trim()},
      city = ${toNullableString(body.city)},
      district = ${toNullableString(body.district)},
      address = ${toNullableString(body.address)},
      lat = ${Number(body.lat)},
      lng = ${Number(body.lng)}
    where id = ${locationId}
    returning *
  `;

  if (!location) {
    throw new Error("Location not found.");
  }

  return { location };
}

export async function deleteLocationController(locationId) {
  const [location] = await sql`
    delete from airpath.locations
    where id = ${locationId}
    returning *
  `;

  if (!location) {
    throw new Error("Location not found.");
  }

  return { location };
}
