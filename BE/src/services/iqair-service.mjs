import { sql } from "../db.mjs";

const iqAirMeasurementCache = new Map();
const iqAirBackoffCache = new Map();
const iqAirStaleCache = new Map();

const IQAIR_CACHE_TTL_MS = 15 * 60 * 1000;
const IQAIR_BACKOFF_MS = 5 * 60 * 1000;
const IQAIR_STALE_TTL_MS = 12 * 60 * 60 * 1000;

function getCacheKey(lat, lng) {
  return `${Number(lat).toFixed(4)}|${Number(lng).toFixed(4)}`;
}

function isRateLimitError(error) {
  return error instanceof Error && /status 429/i.test(error.message);
}

export async function fetchIqAirMeasurement(lat, lng) {
  const cacheKey = getCacheKey(lat, lng);
  const cached = iqAirMeasurementCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const backoff = iqAirBackoffCache.get(cacheKey);
  if (backoff && backoff.expiresAt > Date.now()) {
    const stale = iqAirStaleCache.get(cacheKey);
    if (stale && stale.expiresAt > Date.now()) {
      return Promise.resolve(stale.measurement);
    }
    const dbFallback = await fetchNearestDatabaseMeasurement(lat, lng);
    if (dbFallback) {
      return dbFallback;
    }
  }

  const promise = fetchIqAirMeasurementFresh(lat, lng, cacheKey);

  iqAirMeasurementCache.set(cacheKey, {
    expiresAt: Date.now() + IQAIR_CACHE_TTL_MS,
    promise,
  });

  promise.then((measurement) => {
    const current = iqAirMeasurementCache.get(cacheKey);
    if (current?.promise === promise) {
      iqAirMeasurementCache.set(cacheKey, {
        expiresAt: Date.now() + IQAIR_CACHE_TTL_MS,
        promise: Promise.resolve(measurement),
        measurement,
      });
      iqAirStaleCache.set(cacheKey, {
        expiresAt: Date.now() + IQAIR_STALE_TTL_MS,
        measurement,
      });
    }
  });

  promise.catch(async (error) => {
    const current = iqAirMeasurementCache.get(cacheKey);
    if (current?.promise === promise) {
      iqAirMeasurementCache.delete(cacheKey);
    }

    if (isRateLimitError(error)) {
      iqAirBackoffCache.set(cacheKey, {
        expiresAt: Date.now() + IQAIR_BACKOFF_MS,
      });

      const stale = iqAirStaleCache.get(cacheKey);
      if (stale && stale.expiresAt > Date.now()) {
        return;
      }

      const dbFallback = await fetchNearestDatabaseMeasurement(lat, lng);
      if (dbFallback) {
        iqAirStaleCache.set(cacheKey, {
          expiresAt: Date.now() + IQAIR_STALE_TTL_MS,
          measurement: dbFallback,
        });
      }
    }
  });

  return promise;
}

async function fetchIqAirMeasurementFresh(lat, lng, cacheKey) {
  const apiKey = process.env.IQAIR_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error("Missing IQAIR_API_KEY on server.");
  }

  const iqAirUrl = new URL("https://api.airvisual.com/v2/nearest_city");
  iqAirUrl.searchParams.set("lat", String(lat));
  iqAirUrl.searchParams.set("lon", String(lng));
  iqAirUrl.searchParams.set("key", String(apiKey).trim());

  const response = await fetch(iqAirUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      const stale = iqAirStaleCache.get(cacheKey);
      if (stale && stale.expiresAt > Date.now()) {
        return stale.measurement;
      }

      const dbFallback = await fetchNearestDatabaseMeasurement(lat, lng);
      if (dbFallback) {
        return dbFallback;
      }

      iqAirBackoffCache.set(cacheKey, {
        expiresAt: Date.now() + IQAIR_BACKOFF_MS,
      });
    }

    throw new Error(`IQAir request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  if (payload?.status !== "success") {
    const stale = iqAirStaleCache.get(cacheKey);
    if (stale && stale.expiresAt > Date.now()) {
      return stale.measurement;
    }

    const dbFallback = await fetchNearestDatabaseMeasurement(lat, lng);
    if (dbFallback) {
      return dbFallback;
    }

    throw new Error(payload?.data?.message || payload?.message || "IQAir returned an error.");
  }

  const cityData = payload?.data ?? {};
  const pollution = cityData?.current?.pollution ?? {};
  const weather = cityData?.current?.weather ?? {};
  const coordinates = cityData?.location?.coordinates;

  const measurement = {
    aqi: toNullableNumber(pollution?.aqius),
    measured_at: toNullableString(pollution?.ts),
    source: "IQAir",
    location_name:
      [cityData?.city, cityData?.state, cityData?.country].filter(Boolean).join(", ") ||
      "Nearest city",
    lat: Array.isArray(coordinates) && typeof coordinates[1] === "number" ? coordinates[1] : Number(lat),
    lng: Array.isArray(coordinates) && typeof coordinates[0] === "number" ? coordinates[0] : Number(lng),
    main_pollutant: toNullableString(pollution?.mainus),
    aqicn: toNullableNumber(pollution?.aqicn),
    temperature: toNullableNumber(weather?.tp),
    humidity: toNullableNumber(weather?.hu),
    wind_speed: toNullableNumber(weather?.ws),
  };

  iqAirMeasurementCache.set(cacheKey, {
    expiresAt: Date.now() + IQAIR_CACHE_TTL_MS,
    promise: Promise.resolve(measurement),
    measurement,
  });
  iqAirStaleCache.set(cacheKey, {
    expiresAt: Date.now() + IQAIR_STALE_TTL_MS,
    measurement,
  });

  return measurement;
}

async function fetchNearestDatabaseMeasurement(lat, lng) {
  const [row] = await sql`
    select
      m.aqi,
      m.measured_at,
      l.name as location_name,
      l.lat,
      l.lng
    from airpath.aqi_measurements m
    join airpath.locations l on l.id = m.location_id
    order by power(l.lat - ${lat}, 2) + power(l.lng - ${lng}, 2), m.measured_at desc
    limit 1
  `;

  if (!row) {
    return null;
  }

  return {
    aqi: toNullableNumber(row.aqi),
    measured_at: toNullableString(row.measured_at),
    source: "DB",
    location_name: row.location_name ?? "Nearest database location",
    lat: toNullableNumber(row.lat) ?? Number(lat),
    lng: toNullableNumber(row.lng) ?? Number(lng),
    main_pollutant: null,
    aqicn: null,
    temperature: null,
    humidity: null,
    wind_speed: null,
  };
}

function toNullableNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toNullableString(value) {
  return typeof value === "string" && value.trim() ? value : null;
}
