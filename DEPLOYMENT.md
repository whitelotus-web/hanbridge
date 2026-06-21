# HanBridge — Deployment Guide

This guide covers shipping HanBridge to production: the **API** (FastAPI),
the **Web** app (Next.js), the **database/cache** (Postgres + Redis), the
**mobile** app (Expo), plus secrets, the AI cost-control strategy, payments and
a go-live checklist.

---

## 1. Architecture

```
                 ┌─────────────┐     ┌──────────────┐
   Browsers ───▶ │  Web (Next) │ ──▶ │  API (FastAPI)│ ──▶ Postgres
                 └─────────────┘     │   + Redis     │ ──▶ Redis (cache,
   Mobile  ─────────────────────────▶│               │      rate limits)
   (Expo)                            └──────┬────────┘
                                            │
                                   Gemini · PayPal · PayOS
```

- **Web** and **Mobile** are both thin clients of the same REST API (`/api/v1`).
- **Redis** backs caching + rate limiting (critical for the AI cost controls below).

---

## 2. Environment variables

Copy `.env.example` and fill these in. **Never commit real secrets.**

### API (`apps/api`)
| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql+psycopg://user:pass@host:5432/db` |
| `REDIS_URL` | ✅ | `redis://host:6379/0` |
| `SECRET_KEY` | ✅ | 32+ byte random string (`openssl rand -hex 32`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | – | default 30 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | – | default 14 |
| `BACKEND_CORS_ORIGINS` | ✅ | comma-separated, e.g. `https://hanbridge.app` |
| `ENVIRONMENT` | ✅ | `production` |
| `GEMINI_API_KEY` | optional | empty → AI runs in safe dev-fallback |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_MODE` | for billing | `PAYPAL_MODE=live` in prod |
| `PAYOS_CLIENT_ID` / `PAYOS_API_KEY` / `PAYOS_CHECKSUM_KEY` | for VN billing | |

### Web (`apps/web`)
| Var | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | e.g. `https://api.hanbridge.app` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | canonical origin for SEO, e.g. `https://hanbridge.app` |

### Mobile (`apps/mobile`)
| Var | Required | Notes |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | ✅ | public API URL |

> **Secrets never live in code.** `GEMINI_API_KEY` and payment keys are server-side
> env vars only. The Admin CMS may toggle AI features / models, but the key value
> itself stays in the environment, never in the database.

---

## 3. Database & migrations

Provision managed **Postgres 16** and **Redis 7** (Neon/Supabase/RDS for PG; Upstash/ElastiCache for Redis).

```bash
cd apps/api
uv sync
uv run alembic upgrade head      # apply all migrations
```

Run `alembic upgrade head` on every deploy (e.g. as a release/pre-start step).

### First admin (bootstrap)
There is **no public "make me admin" route**. After the first user registers,
promote them once, directly against the DB:

```sql
UPDATE users SET is_staff = true WHERE email = 'you@example.com';
```

Then sign in — the `/admin` console (Phase 6c) becomes available.

---

## 4. Deploy the API

Use the provided container or any Python host. Example with Docker:

```dockerfile
# apps/api/Dockerfile (suggested)
FROM python:3.12-slim
RUN pip install uv
WORKDIR /app
COPY apps/api/ .
RUN uv sync --frozen
ENV PORT=8000
CMD ["sh","-c","uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
```

Host options: **Fly.io**, **Render**, **Railway**, AWS ECS, etc. Set all API env
vars (section 2). Point a domain like `api.hanbridge.app` at it and put it behind HTTPS.

---

## 5. Deploy the Web app

**Vercel (recommended)** — set root to `apps/web`, framework Next.js, and the two
`NEXT_PUBLIC_*` env vars. Or self-host:

```bash
cd apps/web
pnpm install
pnpm build
pnpm start            # Next server on :3000 (put behind a reverse proxy)
```

After deploy, set `NEXT_PUBLIC_SITE_URL` to the live origin so canonical URLs,
`/sitemap.xml`, hreflang and OG images are correct, then submit
`https://<domain>/sitemap.xml` in Google Search Console.

---

## 6. Secrets & CI

GitHub → **Settings → Secrets and variables → Actions** → add e.g. `GEMINI_API_KEY`,
payment keys. Reference them in workflows via `${{ secrets.GEMINI_API_KEY }}`.

> ⚠️ **Action required (one-time):** the repo's default branch is currently
> `devin/1781968435-scaffold`. Change it to **`main`** under
> *Settings → Branches → Default branch*, and consider enabling branch protection
> (require the CI checks to pass before merge).

---

## 7. AI (Gemini): should we use it, and how to not blow the quota

**Yes — keep the AI tutor**, it's a core differentiator. But protect cost/quota
with layered safeguards (Redis is already a dependency, so these are cheap to add):

1. **Per-user rate limits** — e.g. Free: 5 AI calls/day, VIP: 100/day. Enforce in
   Redis with a daily-expiring counter keyed by `user_id`. Return HTTP 429 with a
   friendly message when exceeded.
2. **Cache deterministic answers** — "Explain this question" for a given
   `question_id` is the same for everyone: cache the explanation (Redis/DB) and
   serve from cache instead of re-calling Gemini.
3. **Global daily budget** — a system-wide counter; when the day's budget is hit,
   automatically fall back to the existing **dev-fallback** responder instead of
   erroring. This guarantees the app never breaks on quota exhaustion.
4. **Use Gemini Flash** for the bulk of traffic (cheap + fast) and cap output
   length; reserve a stronger model only for premium features if needed.
5. **Gate AI behind VIP** (already supported by Phase 5 billing) — naturally caps
   volume and ties AI cost to revenue.
6. **Stream + truncate** long answers, and debounce the tutor chat input.

The current `services/ai.py` already has a safe dev-fallback, so the graceful
degradation in (3) fits the existing design. Recommended next step: add the
Redis rate-limit + cache layer around the `/ai/*` endpoints.

---

## 8. Payments (go-live)

- **PayPal**: switch `PAYPAL_MODE=live` and use live `CLIENT_ID/SECRET`.
- **PayOS** (Vietnam): set live `CLIENT_ID / API_KEY / CHECKSUM_KEY`.
- Register **webhook URLs** with each provider and verify signatures.
- Test the full purchase → VIP activation → content-unlock flow in sandbox first.

---

## 9. Mobile (Expo)

```bash
cd apps/mobile
npm install
npx expo install --check          # align native deps
# Cloud build & submit with EAS:
npm i -g eas-cli && eas login
eas build --platform all
eas submit --platform ios         # / android
```

Set `EXPO_PUBLIC_API_BASE_URL` to the production API. See `apps/mobile/README.md`.

---

## 10. Go-live checklist

- [ ] Default branch set to `main` (+ branch protection on CI).
- [ ] Postgres + Redis provisioned; `alembic upgrade head` runs on deploy.
- [ ] API deployed with all env vars; HTTPS; `BACKEND_CORS_ORIGINS` = web origin.
- [ ] Web deployed; `NEXT_PUBLIC_SITE_URL` + `NEXT_PUBLIC_API_BASE_URL` set.
- [ ] First admin promoted (`is_staff = true`).
- [ ] `GEMINI_API_KEY` set (or accept dev-fallback) + AI rate-limit/cache in place.
- [ ] Payments switched to live + webhooks verified.
- [ ] `sitemap.xml` submitted to Search Console; `robots.txt` reachable.
- [ ] Replace `SAMPLE`-tagged seed content with licensed question banks.
- [ ] Mobile build submitted to stores (when ready).


---

## 11. Quick free-tier deploy (Vercel + Render + Neon + Upstash)

A fully free stack that **auto-redeploys on every `git push` to `main`**. No
credit card required for the free tiers.

| Component | Service | Free? | Auto-deploy on push |
|-----------|---------|-------|---------------------|
| Web (Next.js) | **Vercel** (Hobby) | Yes | Yes |
| API (FastAPI) | **Render** (Free Web Service) | Yes | Yes |
| Postgres | **Neon** | Yes (serverless) | n/a |
| Redis | **Upstash** | Yes | n/a |

> Note: Render's free web service sleeps after ~15 min idle (first request then
> takes ~30s to wake). Fine for testing; upgrade to the $7/mo Starter plan to
> keep it always-on for real users.

### Step 1 — Database (Neon)
1. Sign up at neon.tech → **New Project** (region close to your users).
2. Copy the connection string and convert the driver prefix to psycopg:
   `postgresql://USER:PASS@HOST/db` → `postgresql+psycopg://USER:PASS@HOST/db?sslmode=require`
3. Keep it handy as `DATABASE_URL`.

### Step 2 — Redis (Upstash, optional but recommended)
1. Sign up at upstash.com → **Create Database** (Redis).
2. Copy the `redis://` URL → keep as `REDIS_URL`.

### Step 3 — API (Render)
1. Push this repo to GitHub (`main`).
2. Render Dashboard → **New → Blueprint** → select the repo. Render reads
   `render.yaml` and creates the `hanbridge-api` service.
3. In the service's **Environment**, set:
   - `DATABASE_URL` = your Neon URL (step 1)
   - `BACKEND_CORS_ORIGINS` = your Vercel URL (e.g. `https://hanbridge.vercel.app`)
   - `FRONTEND_URL` = same Vercel URL
   - (optional) `REDIS_URL`, `GEMINI_API_KEY`, PayPal/PayOS keys
4. First deploy runs `alembic upgrade head` + seeds SAMPLE content automatically.
5. Note the API URL: `https://hanbridge-api.onrender.com`.
6. Promote your first admin (one-time), via the Render shell:
   ```bash
   python -c "from app.db.session import SessionLocal; from app.models.user import User; \
   db=SessionLocal(); u=db.query(User).filter(User.email=='you@example.com').first(); \
   u.is_staff=True; db.commit(); print('admin set')"
   ```
   (Register that email in the app first.)

### Step 4 — Web (Vercel)
1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory** = `apps/web` (important for the monorepo).
3. Framework preset: **Next.js** (auto-detected).
4. Environment variable:
   - `NEXT_PUBLIC_API_BASE_URL` = your Render API URL (step 3.5)
5. Deploy. Your site is live at `https://<project>.vercel.app`.
6. Add a custom domain in **Settings → Domains** (free; just point DNS).

### Step 5 — Turn on the AI tutor
- Log in as the admin → **Admin → Settings** → paste your free Gemini key from
  aistudio.google.com → Save. The tutor switches from offline fallback to live
  instantly (no redeploy). Alternatively set `GEMINI_API_KEY` in Render.

### Updating later
Just push to `main`:
```bash
git add -A && git commit -m "tweak" && git push
```
Vercel rebuilds the web app and Render redeploys the API automatically (~1-2 min).
