import { createLocationController, listLocationsController } from "../controllers/location-controller.mjs";
import { methodNotAllowed, readJsonBody, sendJson } from "../utils/http.mjs";

export async function handleLocationRoutes(req, res, pathname, searchParams) {
  if (pathname !== "/api/locations") {
    return false;
  }

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, ...(await listLocationsController(searchParams)) });
    return true;
  }

  if (req.method === "POST") {
    const body = await readJsonBody(req);
    sendJson(res, 201, { ok: true, ...(await createLocationController(body)) });
    return true;
  }

  methodNotAllowed(res);
  return true;
}

