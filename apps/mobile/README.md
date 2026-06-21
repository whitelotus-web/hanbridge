# HanBridge Mobile (Expo)

The HanBridge mobile app — built with **Expo / React Native + expo-router** — that
talks to the same FastAPI backend as the web app (`apps/api`).

> This is a **standalone** project: it manages its own dependencies and is **not**
> part of the root pnpm workspace (React Native tooling and pnpm's symlinked
> `node_modules` don't mix well). Run all commands from inside `apps/mobile/`.

## What's here

- `app/` — file-based routes (expo-router)
  - `index.tsx` — auth gate (redirects to tabs or login)
  - `login.tsx`, `register.tsx` — auth screens
  - `(tabs)/` — main app: **Levels**, **Dashboard**, **AI Tutor**
- `src/lib/api.ts` — typed API client (mirrors `apps/web/src/lib/api.ts`)
- `src/lib/auth.tsx` — auth context; tokens stored with `expo-secure-store`
- `src/lib/theme.ts` — shared colors / spacing

## Quick start

```bash
cd apps/mobile
npm install          # or: yarn / bun install
cp .env.example .env # set EXPO_PUBLIC_API_BASE_URL to your API
npm run start        # press i (iOS), a (Android), or w (web)
```

Make sure the API is running (`cd ../api && uv run uvicorn app.main:app --reload`).
On a **physical device**, set `EXPO_PUBLIC_API_BASE_URL` to your computer's LAN IP
(e.g. `http://192.168.1.10:8000`) — `localhost` only resolves on the iOS simulator.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
```

## Roadmap

- [x] Auth (login / register / secure token storage / session restore)
- [x] HSK level catalog
- [x] Dashboard (stats + gamification)
- [x] AI tutor chat
- [ ] Full practice & mock-test runners
- [ ] Offline vocabulary SRS
- [ ] Push notifications (streak reminders)
- [ ] EAS build + store submission
