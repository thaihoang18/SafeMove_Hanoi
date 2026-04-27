import { sql } from "../db.mjs";
import { toBoolean, toNullableString } from "../utils/validation.mjs";

export async function listNotificationsController(userId) {
  const notifications = await sql`
    select
      id,
      type,
      title,
      description,
      is_read,
      is_pinned,
      related_route_request_id,
      related_advice_event_id,
      created_at,
      read_at
    from airpath.notifications
    where user_id = ${userId}
    order by is_pinned desc, created_at desc
    limit 50
  `;

  return { notifications };
}

export async function markNotificationReadController(notificationId) {
  const [notification] = await sql`
    update airpath.notifications
    set
      is_read = true,
      read_at = now()
    where id = ${notificationId}
    returning *
  `;

  if (!notification) {
    throw new Error("Notification not found.");
  }

  return { notification };
}

export async function getNotificationPreferencesController(userId) {
  const rows = await sql`
    select *
    from airpath.notification_preferences
    where user_id = ${userId}
  `;

  if (!rows[0]) {
    throw new Error("Notification preferences not found.");
  }

  return { notificationPreferences: rows[0] };
}

export async function updateNotificationPreferencesController(userId, prefs) {
  const [notificationPreferences] = await sql`
    insert into airpath.notification_preferences (
      user_id,
      alert_enabled,
      tip_enabled,
      route_enabled,
      social_enabled,
      system_enabled,
      push_enabled,
      email_enabled,
      daily_tip_time,
      weekly_report_enabled
    ) values (
      ${userId},
      ${toBoolean(prefs.alertEnabled, true)},
      ${toBoolean(prefs.tipEnabled, true)},
      ${toBoolean(prefs.routeEnabled, true)},
      ${toBoolean(prefs.socialEnabled, false)},
      ${toBoolean(prefs.systemEnabled, true)},
      ${toBoolean(prefs.pushEnabled, true)},
      ${toBoolean(prefs.emailEnabled, false)},
      ${toNullableString(prefs.dailyTipTime)},
      ${toBoolean(prefs.weeklyReportEnabled, true)}
    )
    on conflict (user_id) do update
    set
      alert_enabled = excluded.alert_enabled,
      tip_enabled = excluded.tip_enabled,
      route_enabled = excluded.route_enabled,
      social_enabled = excluded.social_enabled,
      system_enabled = excluded.system_enabled,
      push_enabled = excluded.push_enabled,
      email_enabled = excluded.email_enabled,
      daily_tip_time = excluded.daily_tip_time,
      weekly_report_enabled = excluded.weekly_report_enabled
    returning *
  `;

  return { notificationPreferences };
}

