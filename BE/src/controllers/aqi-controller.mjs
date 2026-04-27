import { sql } from "../db.mjs";
import { assert, isNonEmptyString, parseUuidParam, toNullableNumber, toNullableString } from "../utils/validation.mjs";

function parseCoordinate(rawValue, fieldName, min, max) {
  const value = Number(rawValue);
  assert(Number.isFinite(value), `${fieldName} must be a valid number.`);
  assert(value >= min && value <= max, `${fieldName} must be between ${min} and ${max}.`);
  return value;
}

export async function getLatestAqiController(searchParams) {
  const locationId = searchParams.get("locationId");
  assert(isNonEmptyString(locationId), "locationId is required.");

  const measurement = (
    await sql`
      select
        l.id as location_id,
        l.name as location_name,
        m.id,
        m.measured_at,
        m.aqi,
        m.pm25,
        m.pm10,
        m.no2,
        m.o3,
        m.co,
        m.so2,
        m.source
      from airpath.locations l
      join airpath.aqi_measurements m on m.location_id = l.id
      where l.id = ${locationId}
      order by m.measured_at desc
      limit 1
    `
  )[0] ?? null;

  return { measurement };
}

export async function createMeasurementController(body) {
  const [measurement] = await sql`
    insert into airpath.aqi_measurements (
      location_id,
      measured_at,
      aqi,
      pm25,
      pm10,
      no2,
      o3,
      co,
      so2,
      source
    ) values (
      ${parseUuidParam(body.locationId, "locationId")},
      ${toNullableString(body.measuredAt) ?? new Date().toISOString()},
      ${Number(body.aqi)},
      ${toNullableNumber(body.pm25)},
      ${toNullableNumber(body.pm10)},
      ${toNullableNumber(body.no2)},
      ${toNullableNumber(body.o3)},
      ${toNullableNumber(body.co)},
      ${toNullableNumber(body.so2)},
      ${toNullableString(body.source)}
    )
    returning *
  `;

  return { measurement };
}

export async function getIqAirAqiController(searchParams) {
  const apiKey = process.env.IQAIR_API_KEY;
  assert(isNonEmptyString(apiKey), "Missing IQAIR_API_KEY on server.");

  const lat = parseCoordinate(searchParams.get("lat"), "lat", -90, 90);
  const lngRaw = searchParams.get("lng") ?? searchParams.get("lon");
  const lng = parseCoordinate(lngRaw, "lng", -180, 180);

  const iqAirUrl = new URL("https://api.airvisual.com/v2/nearest_city");
  iqAirUrl.searchParams.set("lat", String(lat));
  iqAirUrl.searchParams.set("lon", String(lng));
  iqAirUrl.searchParams.set("key", apiKey.trim());

  const response = await fetch(iqAirUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`IQAir request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  if (payload?.status !== "success") {
    throw new Error(payload?.data?.message || payload?.message || "IQAir returned an error.");
  }

  const cityData = payload?.data ?? {};
  const pollution = cityData?.current?.pollution ?? {};
  const coordinates = cityData?.location?.coordinates;

  return {
    measurement: {
      aqi: toNullableNumber(pollution?.aqius),
      measured_at: toNullableString(pollution?.ts),
      source: "IQAir",
      location_name:
        [cityData?.city, cityData?.state, cityData?.country].filter(Boolean).join(", ") ||
        "Nearest city",
      lat: Array.isArray(coordinates) && typeof coordinates[1] === "number" ? coordinates[1] : lat,
      lng: Array.isArray(coordinates) && typeof coordinates[0] === "number" ? coordinates[0] : lng,
      main_pollutant: toNullableString(pollution?.mainus),
      aqicn: toNullableNumber(pollution?.aqicn),
    },
  };
}

