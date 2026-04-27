# AirPath BE

Backend scaffold for the AQI routing and personalized advice flows.

## Run

From the repo root:

```powershell
cd BE
npm run dev
```

`npm run dev` reads environment variables from `../.env`.

Required env vars:

- `DATABASE_URL`
- `PORT` (optional, default from code)
- `IQAIR_API_KEY` (for GPS-based AQI lookup)
- `LLM_PROVIDER` (optional, default `ollama`)
- `LLM_BASE_URL` (optional, default `http://127.0.0.1:11434/v1`)
- `LLM_API_KEY` (optional, default `ollama`)
- `LLM_MODEL` (optional, default `qwen2.5:7b`)

## Endpoints

- `GET /api/health`
- `GET /api/bootstrap`
- `POST /api/users/register`
- `POST /api/auth/login`
- `GET /api/chat/sessions?userId=...`
- `GET /api/chat/sessions/:sessionId/messages`
- `POST /api/chat/sessions`
- `POST /api/chat/message`
- `GET /api/users/:userId/profile`
- `PUT /api/users/:userId/profile`
- `GET /api/users/:userId/dashboard`
- `GET /api/users/:userId/route-requests`
- `GET /api/users/:userId/advice-events`
- `GET /api/users/:userId/notifications`
- `GET /api/users/:userId/notification-preferences`
- `PUT /api/users/:userId/notification-preferences`
- `PATCH /api/notifications/:notificationId/read`
- `GET /api/locations`
- `POST /api/locations`
- `GET /api/maps/search?q=...`
- `POST /api/maps/plan-routes`
- `GET /api/aqi/iqair?lat=...&lng=...`
- `GET /api/aqi/latest`
- `POST /api/aqi/measurements`
- `GET /api/indoor-places`
- `POST /api/indoor-places`
- `POST /api/indoor-places/:placeId/measurements`
- `POST /api/route-requests`
- `GET /api/route-requests/:requestId`
- `GET /api/advice-rules`
- `POST /api/advice-rules`
- `POST /api/advice/preview`
- `POST /api/advice-events`

## Chatbot

The chatbot is wired for an OpenAI-compatible model server. The default local setup is Ollama:

```powershell
ollama pull qwen2.5:7b
ollama serve
```
