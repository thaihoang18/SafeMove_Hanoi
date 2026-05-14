import { sql } from "../db.mjs";
import { assert, isNonEmptyString } from "../utils/validation.mjs";

function parseCoordinate(rawValue, fieldName, min, max) {
  const value = Number(rawValue);
  assert(Number.isFinite(value), `${fieldName} must be a valid number.`);
  assert(value >= min && value <= max, `${fieldName} must be between ${min} and ${max}.`);
  return value;
}

function normalizePlace(raw) {
  return {
    id: String(raw.place_id),
    label: raw.display_name,
    lat: Number(raw.lat),
    lng: Number(raw.lon),
    source: "nominatim",
  };
}

function translateModifier(modifier) {
  const map = {
    left: "trái",
    right: "phải",
    straight: "thẳng",
    "slight left": "chếch trái",
    "slight right": "chếch phải",
    "sharp left": "gắt trái",
    "sharp right": "gắt phải",
    uturn: "quay đầu",
  };

  return map[modifier] ?? modifier;
}

function buildInstruction(step) {
  const type = step?.maneuver?.type;
  const modifier = step?.maneuver?.modifier;
  const name = step?.name ? ` vào ${step.name}` : "";

  if (type === "depart") {
    return `Bắt đầu di chuyển${name}`;
  }

  if (type === "arrive") {
    return "Bạn đã đến nơi";
  }

  if (type === "roundabout") {
    return `Đi vòng xuyến${name}`;
  }

  if (type === "merge") {
    return `Nhập làn${name}`;
  }

  if (type === "fork") {
    return `Đi theo nhánh ${translateModifier(modifier ?? "straight")}${name}`;
  }

  if (type === "turn") {
    return `Rẽ ${translateModifier(modifier ?? "straight")}${name}`;
  }

  if (modifier) {
    return `Đi ${translateModifier(modifier)}${name}`;
  }

  return `Tiếp tục di chuyển${name}`;
}

function deriveExposure(avgAqi) {
  if (avgAqi >= 151) {
    return "high";
  }
  if (avgAqi >= 101) {
    return "medium";
  }
  return "low";
}

function average(values) {
  if (!values.length) {
    return null;
  }

  const sum = values.reduce((total, current) => total + current, 0);
  return sum / values.length;
}

function pickSampleCoordinates(routeGeometry) {
  const coordinates = routeGeometry?.coordinates ?? [];
  if (!coordinates.length) {
    return [];
  }

  const indices = [0, Math.floor(coordinates.length / 2), coordinates.length - 1];
  const unique = new Set();
  const samples = [];

  for (const index of indices) {
    const point = coordinates[index];
    if (!point || typeof point[0] !== "number" || typeof point[1] !== "number") {
      continue;
    }

    const key = `${point[0].toFixed(4)},${point[1].toFixed(4)}`;
    if (unique.has(key)) {
      continue;
    }

    unique.add(key);
    samples.push({ lng: point[0], lat: point[1] });
  }

  return samples;
}

async function fetchAqiFromIqAir(lat, lng) {
  const apiKey = process.env.IQAIR_API_KEY;
  if (!isNonEmptyString(apiKey)) {
    return null;
  }

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
    return null;
  }

  const payload = await response.json();
  if (payload?.status !== "success") {
    return null;
  }

  const pollution = payload?.data?.current?.pollution;
  const aqi = Number(pollution?.aqius);
  if (!Number.isFinite(aqi)) {
    return null;
  }

  return {
    aqi,
    source: "IQAir",
  };
}

async function fetchAqiFromDatabase(lat, lng) {
  const row = (
    await sql`
      select
        m.aqi,
        m.measured_at,
        l.name as location_name
      from airpath.aqi_measurements m
      join airpath.locations l on l.id = m.location_id
      order by
        power(l.lat - ${lat}, 2) + power(l.lng - ${lng}, 2),
        m.measured_at desc
      limit 1
    `
  )[0];

  if (!row) {
    return null;
  }

  return {
    aqi: Number(row.aqi),
    source: "db",
    measuredAt: row.measured_at,
    locationName: row.location_name,
  };
}

async function estimateRouteAqi(routeGeometry, cache) {
  const samples = pickSampleCoordinates(routeGeometry);
  if (!samples.length) {
    return {
      avgAqi: 140,
      aqiSource: "estimated",
    };
  }

  const sampleValues = [];

  for (const sample of samples) {
    const cacheKey = `${sample.lat.toFixed(4)},${sample.lng.toFixed(4)}`;
    if (cache.has(cacheKey)) {
      sampleValues.push(cache.get(cacheKey));
      continue;
    }

    const iqAir = await fetchAqiFromIqAir(sample.lat, sample.lng);
    if (iqAir?.aqi) {
      cache.set(cacheKey, iqAir.aqi);
      sampleValues.push(iqAir.aqi);
      continue;
    }

    const dbAqi = await fetchAqiFromDatabase(sample.lat, sample.lng);
    if (dbAqi?.aqi) {
      cache.set(cacheKey, dbAqi.aqi);
      sampleValues.push(dbAqi.aqi);
      continue;
    }

    cache.set(cacheKey, 150);
    sampleValues.push(150);
  }

  return {
    avgAqi: Math.round(average(sampleValues) ?? 140),
    aqiSource: "IQAir/DB",
  };
}

function normalize(value, min, max) {
  if (max <= min) {
    return 0;
  }

  return (value - min) / (max - min);
}

function pickDistinctIndex(baseIndex, rankedIndices, blockedSet) {
  if (!blockedSet.has(baseIndex)) {
    blockedSet.add(baseIndex);
    return baseIndex;
  }

  for (const candidate of rankedIndices) {
    if (!blockedSet.has(candidate)) {
      blockedSet.add(candidate);
      return candidate;
    }
  }

  return baseIndex;
}

function mapRouteForClient(route, maxRatio, shortestDistance) {
  const routeName = route.routeName;
  return {
    routeId: route.routeId,
    routeName,
    distanceM: Math.round(route.distanceM),
    durationS: Math.round(route.durationS),
    avgAqi: route.avgAqi,
    exposureScore: Math.round(route.exposureScore),
    exposure: deriveExposure(route.avgAqi),
    isWithinRatio: route.distanceM <= shortestDistance * maxRatio,
    aqiSource: route.aqiSource,
    polyline: JSON.stringify(route.geometry?.coordinates ?? []),
    geometry: route.geometry,
    steps: route.steps,
  };
}

export async function searchPlacesController(searchParams) {
  const query = (searchParams.get("q") ?? "").trim();
  assert(query.length >= 2, "q must have at least 2 characters.");

  const limit = Math.min(Number(searchParams.get("limit") ?? 6), 8);
  const countryCodes = searchParams.get("countrycodes") ?? "vn";

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", query);
  nominatimUrl.searchParams.set("format", "jsonv2");
  nominatimUrl.searchParams.set("addressdetails", "1");
  nominatimUrl.searchParams.set("limit", String(limit));
  nominatimUrl.searchParams.set("countrycodes", countryCodes);

  const response = await fetch(nominatimUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "SafeMove HaNoi/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Place search failed: ${response.status}`);
  }

  const payload = await response.json();
  const places = Array.isArray(payload) ? payload.map(normalizePlace) : [];

  return { places };
}

export async function planRoutesController(body) {
  assert(isNonEmptyString(body?.origin?.label), "origin.label is required.");
  assert(isNonEmptyString(body?.destination?.label), "destination.label is required.");

  const originLat = parseCoordinate(body.origin.lat, "origin.lat", -90, 90);
  const originLng = parseCoordinate(body.origin.lng, "origin.lng", -180, 180);
  const destinationLat = parseCoordinate(body.destination.lat, "destination.lat", -90, 90);
  const destinationLng = parseCoordinate(body.destination.lng, "destination.lng", -180, 180);
  const maxRatio = Number(body.maxRatio ?? 1.5);

  const osrmUrl = new URL(
    `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destinationLng},${destinationLat}`,
  );
  osrmUrl.searchParams.set("alternatives", "true");
  osrmUrl.searchParams.set("steps", "true");
  osrmUrl.searchParams.set("overview", "full");
  osrmUrl.searchParams.set("geometries", "geojson");

  const routeResponse = await fetch(osrmUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "SafeMove HaNoi/1.0",
    },
  });

  if (!routeResponse.ok) {
    throw new Error(`Routing service failed: ${routeResponse.status}`);
  }

  const routePayload = await routeResponse.json();
  assert(routePayload?.code === "Ok", "Routing service did not return a valid route.");

  const rawRoutes = Array.isArray(routePayload.routes) ? routePayload.routes.slice(0, 4) : [];
  assert(rawRoutes.length > 0, "No routes available for this request.");

  const aqiCache = new Map();
  const enrichedRoutes = [];

  for (let index = 0; index < rawRoutes.length; index += 1) {
    const route = rawRoutes[index];
    const routeName = `Route ${index + 1}`;
    const aqiEstimate = await estimateRouteAqi(route.geometry, aqiCache);
    const distanceM = Number(route.distance);
    const durationS = Number(route.duration);
    const exposureScore = (distanceM / 1000) * aqiEstimate.avgAqi;

    const firstLeg = route.legs?.[0];
    const steps = Array.isArray(firstLeg?.steps)
      ? firstLeg.steps.map((step, stepIndex) => ({
          stepIndex: stepIndex + 1,
          distanceM: Number(step.distance),
          durationS: Number(step.duration),
          roadName: step.name || null,
          instruction: buildInstruction(step),
        }))
      : [];

    enrichedRoutes.push({
      routeId: `route-${index + 1}`,
      routeName,
      distanceM,
      durationS,
      avgAqi: aqiEstimate.avgAqi,
      aqiSource: aqiEstimate.aqiSource,
      exposureScore,
      steps,
      geometry: route.geometry,
    });
  }

  const shortestDistance = Math.min(...enrichedRoutes.map((route) => route.distanceM));
  const shortestIdx = enrichedRoutes.findIndex((route) => route.distanceM === shortestDistance);

  const withinRatioIndices = enrichedRoutes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => route.distanceM <= shortestDistance * maxRatio)
    .sort((a, b) => a.route.avgAqi - b.route.avgAqi)
    .map(({ index }) => index);

  const greenSorted = enrichedRoutes
    .map((route, index) => ({ route, index }))
    .sort((a, b) => a.route.avgAqi - b.route.avgAqi)
    .map(({ index }) => index);

  const greenBaseIdx = withinRatioIndices[0] ?? greenSorted[0] ?? 0;

  const minDistance = Math.min(...enrichedRoutes.map((route) => route.distanceM));
  const maxDistance = Math.max(...enrichedRoutes.map((route) => route.distanceM));
  const minAqi = Math.min(...enrichedRoutes.map((route) => route.avgAqi));
  const maxAqi = Math.max(...enrichedRoutes.map((route) => route.avgAqi));

  const balancedSorted = enrichedRoutes
    .map((route, index) => {
      const distanceScore = normalize(route.distanceM, minDistance, maxDistance);
      const aqiScore = normalize(route.avgAqi, minAqi, maxAqi);
      const balancedScore = 0.5 * distanceScore + 0.5 * aqiScore;
      return {
        index,
        balancedScore,
      };
    })
    .sort((a, b) => a.balancedScore - b.balancedScore)
    .map((item) => item.index);

  const used = new Set();
  const greenIdx = pickDistinctIndex(greenBaseIdx, greenSorted, used);
  const shortestPickedIdx = pickDistinctIndex(shortestIdx, greenSorted, used);
  const balancedIdx = pickDistinctIndex(balancedSorted[0] ?? shortestIdx, balancedSorted, used);

  const greenRoute = mapRouteForClient(enrichedRoutes[greenIdx], maxRatio, shortestDistance);
  const shortestRoute = mapRouteForClient(enrichedRoutes[shortestPickedIdx], maxRatio, shortestDistance);
  const balancedRoute = mapRouteForClient(enrichedRoutes[balancedIdx], maxRatio, shortestDistance);

  return {
    origin: {
      label: body.origin.label,
      lat: originLat,
      lng: originLng,
    },
    destination: {
      label: body.destination.label,
      lat: destinationLat,
      lng: destinationLng,
    },
    maxRatio,
    recommendations: [
      {
        kind: "green",
        title: "Lộ trình xanh",
        reason: greenRoute.isWithinRatio
          ? "AQI thấp nhất trong giới hạn độ dài cho phép"
          : "AQI thấp nhất (vượt nhẹ giới hạn max ratio)",
        route: greenRoute,
      },
      {
        kind: "shortest",
        title: "Lộ trình ngắn nhất",
        reason: "Tối ưu quãng đường và thời gian di chuyển",
        route: shortestRoute,
      },
      {
        kind: "balanced",
        title: "Lộ trình cân bằng",
        reason: "Cân bằng giữa độ dài tuyến và mức độ ô nhiễm",
        route: balancedRoute,
      },
    ],
  };
}
