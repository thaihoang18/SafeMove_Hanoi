import { loginUserController, registerUserController } from "../controllers/auth-controller.mjs";
import { readJsonBody, sendJson } from "../utils/http.mjs";

export async function handleAuthRoutes(req, res, pathname) {
  if (req.method === "POST" && pathname === "/api/users/register") {
    const body = await readJsonBody(req);
    sendJson(res, 201, { ok: true, ...(await registerUserController(body)) });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await readJsonBody(req);
    sendJson(res, 200, { ok: true, ...(await loginUserController(body)) });
    return true;
  }

  return false;
}

