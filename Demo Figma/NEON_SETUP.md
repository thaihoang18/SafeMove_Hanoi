# Neon setup

## 1. Create `.env.local`

Copy `.env.example` to `.env.local` and paste your Neon connection string:

```env
DATABASE_URL=postgresql://USER:PASSWORD@YOUR-NEON-HOST/DBNAME?sslmode=require
PORT=3001
VITE_API_BASE_URL=http://localhost:3001
```

## 2. Install dependencies

```powershell
cd "d:\Project\AirPath\Demo Figma"
npm install
```

## 3. Start the local API

```powershell
npm run dev:api
```

Quick test:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod http://localhost:3001/api/bootstrap
```

## 4. Start the frontend

```powershell
npm run dev
```

## Files added

- `server/db.mjs`: Neon database client
- `server/index.mjs`: local API endpoints
- `src/app/lib/api.ts`: frontend helpers

## Important

Do not put `DATABASE_URL` in Vite client code. Keep it server-side only.
