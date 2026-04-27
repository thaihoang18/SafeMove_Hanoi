import {
  createChatSessionController,
  getChatSessionMessagesController,
  listChatSessionsController,
  sendChatMessageController,
} from "../controllers/chat-controller.mjs";
import { methodNotAllowed, readJsonBody, sendJson } from "../utils/http.mjs";
import { parseUuidParam } from "../utils/validation.mjs";

export async function handleChatRoutes(req, res, pathname, searchParams) {
  if (pathname === "/api/chat/sessions") {
    if (req.method === "GET") {
      sendJson(res, 200, { ok: true, ...(await listChatSessionsController(searchParams)) });
      return true;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      sendJson(res, 201, { ok: true, ...(await createChatSessionController(body)) });
      return true;
    }

    methodNotAllowed(res);
    return true;
  }

  const messagesMatch = pathname.match(/^\/api\/chat\/sessions\/([^/]+)\/messages$/);
  if (messagesMatch) {
    if (req.method !== "GET") {
      methodNotAllowed(res);
      return true;
    }

    sendJson(res, 200, {
      ok: true,
      ...(await getChatSessionMessagesController(parseUuidParam(messagesMatch[1], "sessionId"))),
    });
    return true;
  }

  if (pathname === "/api/chat/message") {
    if (req.method !== "POST") {
      methodNotAllowed(res);
      return true;
    }

    const body = await readJsonBody(req);
    sendJson(res, 200, { ok: true, ...(await sendChatMessageController(body)) });
    return true;
  }

  return false;
}

