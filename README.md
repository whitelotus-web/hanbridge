# HanBridge

**HanBridge** is an HSK (Chinese Proficiency Test) learning & exam-prep platform — a modern, multilingual, AI-assisted clone & upgrade of the SuperTest/hskonline experience.

It covers HSK levels **1–6** plus the new HSK 3.0 advanced band **7–9**, with listening / reading / writing practice, **HSKK** speaking practice, full mock exams, vocabulary SRS, an AI tutor, gamification, VIP subscriptions, and a shared mobile app.

> Question-bank content currently ships as **sample/seed data** (flagged `is_sample` / tagged `SAMPLE`) to be replaced with real licensed content later.

## 🚀 Live learning app (`apps/pwa`)

A fully-functional, installable **Progressive Web App** ships in [`apps/pwa/`](apps/pwa) (also published to [`docs/`](docs) for GitHub Pages). It needs **no build step and no backend** — pure HTML/CSS/JS, works offline.

Features:
- **HSK 1–6 vocabulary decks** (accurate hanzi + tone-marked pinyin + English + Tiếng Việt)
- **Flashcards** with flip animation and native **text-to-speech audio** (中文)
- **Spaced repetition (SRS)** "study today" queue — progress saved on device
- **Quiz modes**: hanzi→meaning, meaning→hanzi, listen→pick
- **Timed mock test** with scoring, pass/fail and answer review
- **Progress dashboard**: streak, XP, daily-goal ring, 28-day activity heatmap, per-level bars
- **Dark mode** + **i18n** UI (EN / Tiếng Việt / 中文)
- **PWA**: installable to home screen, offline-capable (service worker + manifest)

### Deploy free on GitHub Pages
1. Repo **Settings → Pages**
2. **Source**: *Deploy from a branch*
3. **Branch**: `devin/1781968435-scaffold`, **Folder**: `/docs` → **Save**
4. Live in ~1 min at: `https://whitelotus-web.github.io/hanbridge/`

## Monorepo layout

```
hanbridge/
├── apps/
│   ├── web/      # Next.js (App Router) + TypeScript + Tailwind + next-intl  (marketing + learning app)
│   ├── api/      # FastAPI + SQLAlchemy 2.0 + Alembic + Pydantic v2          (REST API)
│   └── mobile/   # Expo / React Native (added in a later phase)
└── docker-compose.yml   # Postgres + Redis for local dev
```

## Tech stack

| Layer    | Tech |
|----------|------|
| Web      | Next.js 14, React 18, TypeScript, Tailwind CSS, next-intl |
| API      | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, Python 3.12 (uv) |
| Data     | PostgreSQL 16, Redis 7 |
| Mobile   | Expo / React Native (planned) |
| AI       | Google Gemini |
| Payments | PayPal (international) + PayOS/Sepay (Vietnam) — pluggable |

## Quick start

### 1. Infrastructure (Postgres + Redis)
```bash
docker compose up -d
```

### 2. API
```bash
cd apps/api
uv sync
cp ../../.env.example .env
uv run uvicorn app.main:app --reload --port 8000
# docs at http://localhost:8000/docs
```

### 3. Web
```bash
cd apps/web
pnpm install
pnpm dev
# http://localhost:3000
```

## Development

- Web lint / typecheck: `pnpm --filter @hanbridge/web lint` / `pnpm --filter @hanbridge/web typecheck`
- API lint / typecheck: `cd apps/api && uv run ruff check . && uv run mypy app`
- API tests: `cd apps/api && uv run pytest`

## Roadmap

- [x] Phase 0/1 — Monorepo scaffold, branded marketing site, i18n, API health, CI
- [ ] Phase 1 — Auth (email/phone, register, reset, QR login)
- [ ] Phase 2 — Catalog + practice engine (HSK1 first) + seed data
- [ ] Phase 3 — Question types HSK 2–9, Writing, HSKK
- [ ] Phase 4 — Mock tests + scoring + analytics
- [ ] Phase 5 — VIP / billing + content gating
- [ ] Phase 6 — AI tutor, gamification, admin CMS, SEO polish
- [ ] Mobile app (Expo)
