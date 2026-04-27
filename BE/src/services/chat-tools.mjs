import { sql } from "../db.mjs";
import { buildAdvicePreview } from "./advice-service.mjs";

export const chatTools = [
  {
    type: "function",
    function: {
      name: "get_user_profile_summary",
      description: "Get the user's health profile, conditions, activities, and alert settings.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string" },
        },
        required: ["userId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_live_air_context",
      description: "Get the user's nearest AQI context, alerts, and personalized advice.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string" },
        },
        required: ["userId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_notifications",
      description: "Get the user's latest notifications and unread status.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string" },
          limit: { type: "number" },
        },
        required: ["userId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_locations",
      description: "Search saved AirPath locations by keyword, street, district, or city.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_location_air_quality",
      description: "Get the latest AQI for a saved AirPath location.",
      parameters: {
        type: "object",
        properties: {
          locationId: { type: "string" },
        },
        required: ["locationId"],
      },
    },
  },
];

export async function executeChatTool(name, args) {
  switch (name) {
    case "get_user_profile_summary":
      return getUserProfileSummary(args.userId);
    case "get_live_air_context":
      return getLiveAirContext(args.userId);
    case "get_recent_notifications":
      return getRecentNotifications(args.userId, args.limit);
    case "find_locations":
      return findLocations(args.query);
    case "get_location_air_quality":
      return getLocationAirQuality(args.locationId);
    default:
      throw new Error(`Unsupported tool: ${name}`);
  }
}

async function getUserProfileSummary(userId) {
  const [userRows, conditionRows, activityRows, profileRows] = await sql.transaction([
    sql`
      select id, email, full_name, birth_year, home_lat, home_lng
      from airpath.users
      where id = ${userId}
    `,
    sql`
      select hc.name, uc.severity
      from airpath.user_conditions uc
      join airpath.health_conditions hc on hc.id = uc.condition_id
      where uc.user_id = ${userId}
      order by hc.name asc
    `,
    sql`
      select a.name, ua.frequency_per_week, ua.is_primary
      from airpath.user_activities ua
      join airpath.activities a on a.id = ua.activity_id
      where ua.user_id = ${userId}
      order by ua.is_primary desc, a.name asc
    `,
    sql`
      select alert_threshold, default_max_route_ratio, mask_preference
      from airpath.user_profiles
      where user_id = ${userId}
    `,
  ]);

  return {
    user: userRows[0] ?? null,
    conditions: conditionRows,
    activities: activityRows,
    profile: profileRows[0] ?? null,
  };
}

async function getLiveAirContext(userId) {
  const [dashboardRows, notifications] = await sql.transaction([
    sql`
      select
        u.id,
        u.full_name,
        p.alert_threshold,
        nearest.location_name,
        nearest.aqi,
        nearest.measured_at
      from airpath.users u
      left join airpath.user_profiles p on p.user_id = u.id
      left join lateral (
        select
          l.name as location_name,
          m.aqi,
          m.measured_at
        from airpath.locations l
        join airpath.aqi_measurements m on m.location_id = l.id
        where u.home_lat is not null
          and u.home_lng is not null
        order by
          power(l.lat - u.home_lat, 2) + power(l.lng - u.home_lng, 2),
          m.measured_at desc
        limit 1
      ) nearest on true
      where u.id = ${userId}
    `,
    sql`
      select type, title, description, created_at, is_read
      from airpath.notifications
      where user_id = ${userId}
      order by created_at desc
      limit 5
    `,
  ]);

  const advicePreview = await buildAdvicePreview({ userId, locationId: null, activityId: null }).catch(
    () => null,
  );

  return {
    air: dashboardRows[0] ?? null,
    advice: advicePreview?.advice ?? null,
    notifications,
  };
}

async function getRecentNotifications(userId, limit = 5) {
  const safeLimit = Math.max(1, Math.min(Number(limit ?? 5), 20));

  const notifications = await sql`
    select type, title, description, created_at, is_read
    from airpath.notifications
    where user_id = ${userId}
    order by created_at desc
    limit ${safeLimit}
  `;

  return { notifications };
}

async function findLocations(query) {
  const q = String(query ?? "").trim();
  if (!q) {
    return { locations: [] };
  }

  const pattern = `%${q}%`;
  const locations = await sql`
    select id, name, address, district, city, lat, lng
    from airpath.locations
    where
      name ilike ${pattern}
      or coalesce(address, '') ilike ${pattern}
      or coalesce(district, '') ilike ${pattern}
      or coalesce(city, '') ilike ${pattern}
    order by name asc
    limit 10
  `;

  return { locations };
}

async function getLocationAirQuality(locationId) {
  const rows = await sql`
    select
      l.id,
      l.name,
      l.address,
      l.district,
      l.city,
      m.aqi,
      m.pm25,
      m.pm10,
      m.measured_at,
      m.source
    from airpath.locations l
    left join lateral (
      select aqi, pm25, pm10, measured_at, source
      from airpath.aqi_measurements
      where location_id = l.id
      order by measured_at desc
      limit 1
    ) m on true
    where l.id = ${locationId}
    limit 1
  `;

  return { location: rows[0] ?? null };
}

