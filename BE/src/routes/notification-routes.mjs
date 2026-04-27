import {
  getNotificationPreferencesController,
  listNotificationsController,
  markNotificationReadController,
  updateNotificationPreferencesController,
} from "../controllers/notification-controller.mjs";
import { methodNotAllowed, readJsonBody, sendJson } from "../utils/http.mjs";
import { parseUuidParam } from "../utils/validation.mjs";

export async function handleNotificationRoutes(req, res, pathname) {
  const userNotificationsMatch = pathname.match(/^\/api\/users\/([^/]+)\/notifications$/);
  if (userNotificationsMatch) {
    if (req.method !== "GET") {
      methodNotAllowed(res);
      return true;
    }

    sendJson(res, 200, {
      ok: true,
      ...(await listNotificationsController(parseUuidParam(userNotificationsMatch[1], "userId"))),
    });
    return true;
  }

  const notificationPreferencesMatch = pathname.match(
    /^\/api\/users\/([^/]+)\/notification-preferences$/,
  );
  if (notificationPreferencesMatch) {
    const userId = parseUuidParam(notificationPreferencesMatch[1], "userId");

    if (req.method === "GET") {
      sendJson(res, 200, {
        ok: true,
        ...(await getNotificationPreferencesController(userId)),
      });
      return true;
    }

    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      sendJson(res, 200, {
        ok: true,
        ...(await updateNotificationPreferencesController(userId, body)),
      });
      return true;
    }

    methodNotAllowed(res);
    return true;
  }

  const notificationReadMatch = pathname.match(/^\/api\/notifications\/([^/]+)\/read$/);
  if (notificationReadMatch) {
    if (req.method !== "PATCH") {
      methodNotAllowed(res);
      return true;
    }

    sendJson(res, 200, {
      ok: true,
      ...(await markNotificationReadController(
        parseUuidParam(notificationReadMatch[1], "notificationId"),
      )),
    });
    return true;
  }

  return false;
}

