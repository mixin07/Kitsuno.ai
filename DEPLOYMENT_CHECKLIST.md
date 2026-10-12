# Kitsuno.ai — Production Deployment Checklist

This document provides the authoritative deployment and infrastructure runbook for the Kitsuno.ai platform.

> [!IMPORTANT]
> **PRE-FLIGHT NOTICE**: This checklist is for deployment preparation. Do **not** deploy without executing the pre-deployment verification suite and securing all required production secrets.

---

## 1. Required Production Environment Variables

### Frontend Environment Variables (Set in Vercel / Cloudflare / Netlify)
| Variable | Description | Example / Format | Secret / Public |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of deployed FastAPI backend | `https://api.kitsuno.ai/api/v1` | Public |
| `VITE_SUPABASE_URL` | Supabase Project API URL | `https://<project-ref>.supabase.co` | Public |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anonymous Client Key | `eyJhbGciOi...` | Public |

### Backend Environment Variables (Set in Render / Railway / Fly.io)
| Variable | Description | Example / Format | Secret / Public |
| :--- | :--- | :--- | :--- |
| `APP_NAME` | Name identifier for API | `Kitsuno.ai API` | Config |
| `ENVIRONMENT` | Operating environment mode | `production` | Config |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://postgres:<pwd>@<host>:5432/<db>` | **SECRET** |
| `CORS_ORIGINS` | Permitted frontend origins (comma-separated) | `https://kitsuno.ai,https://www.kitsuno.ai` | Config |
| `SUPABASE_URL` | Supabase Project API URL (for JWKS verification) | `https://<project-ref>.supabase.co` | Public |
| `SUPABASE_JWT_SECRET` | Supabase JWT Secret (optional fallback for HS256) | `your-supabase-jwt-secret` | **SECRET** |
| `ADMIN_EMAIL` | Designated platform administrator email | `jeyavelan68@gmail.com` | Config |
| `JWT_SECRET_KEY` | Local fallback JWT secret | `random-secure-hex-string` | **SECRET** |
| `JWT_ALGORITHM` | JWT verification algorithm | `HS256` | Config |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `30` | Config |
| `AI_PROVIDER` | AI question generator engine (`mock` or `openai`) | `mock` or `openai` | Config |
| `AI_API_KEY` | OpenAI API key (if `AI_PROVIDER=openai`) | `sk-proj-...` | **SECRET** |
| `AI_MODEL` | Target language model | `gpt-4o-mini` | Config |
| `AI_MAX_QUESTIONS` | Maximum questions per batch generation | `20` | Config |

---

## 2. Frontend Build Command & Configuration
- **Build Tool**: Vite 8 / Rolldown
- **Install Command**: `npm ci` (or `npm install`)
- **Build Command**: `npm run build`
- **Output Directory**: `dist` (or `frontend/dist` depending on root)
- **Node Version**: Node.js 20.x or 22.x LTS

---

## 3. Backend Start Command & Runtime
- **Runtime**: Python 3.11+ / 3.12+ / 3.13+
- **Dependency Install**: `pip install -r requirements.txt` (or pip install from virtualenv)
- **Production Server Command**:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2 --proxy-headers --forwarded-allow-ips='*'
  ```
- **Alternative (Gunicorn Worker Manager)**:
  ```bash
  gunicorn -w 2 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT
  ```

---

## 4. Frontend Hosting Requirements
- **Recommended Provider**: **Vercel** (preferred) or **Cloudflare Pages** / **Netlify**
- **Single Page Application (SPA) Routing**:
  - The client relies on React Router v7 DOM history routing.
  - Vercel: Confirmed configured via `frontend/vercel.json` rewrites (`{"source": "/(.*)", "destination": "/index.html"}`).
  - Netlify: `public/_redirects` rule `/* /index.html 200`.
- **Static Assets**: All SVG course covers, illustrations, and logos located in `public/` are served with proper caching headers.

---

## 5. Backend Hosting Requirements
- **Recommended Provider**: **Render** / **Railway** / **Fly.io** / **AWS App Runner**
- **Health Check Endpoint**: `GET /api/v1/health` (returns `{"status": "ok"}`)
- **Uploads Mount**: Avatars and temporary uploads directory created automatically at runtime in `uploads/`.

---

## 6. Supabase Production Settings
1. **Authentication Configuration**:
   - Navigate to **Authentication** -> **URL Configuration**.
   - Set **Site URL**: `https://<production-domain>` (e.g. `https://kitsuno.ai`).
   - Add **Redirect URLs**:
     - `https://<production-domain>/**`
     - `https://<production-domain>/login`
2. **JWT Configuration**:
   - Verify JWT Expiry settings.
   - Note the JWKS endpoint is active: `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`.

---

## 7. Google OAuth Production Settings
> [!NOTE]
> *Production domain required before final OAuth configuration.*

1. **Google Cloud Console**:
   - Navigate to **APIs & Services** -> **Credentials** -> **OAuth 2.0 Client IDs**.
   - Under **Authorized JavaScript origins**, add:
     - `https://<production-domain>`
     - `https://<project-ref>.supabase.co`
   - Under **Authorized redirect URIs**, add:
     - `https://<project-ref>.supabase.co/auth/v1/callback`
2. **Supabase Provider Setup**:
   - Ensure Google Provider is enabled in Supabase with Client ID and Client Secret.

---

## 8. CORS Configuration
- In `backend/app/config.py`, when `ENVIRONMENT=production`, only origins explicitly declared in `CORS_ORIGINS` are accepted.
- Set `CORS_ORIGINS` to exact production domain(s):
  `https://kitsuno.ai,https://www.kitsuno.ai`
- Never set `CORS_ORIGINS=*` when credentials / Authorization headers are permitted.

---

## 9. Domain & DNS Configuration
- Primary domain: e.g. `kitsuno.ai` -> CNAME / A record pointing to Frontend host (Vercel).
- API subdomain: e.g. `api.kitsuno.ai` -> CNAME record pointing to Backend host (Render).

---

## 10. SSL / HTTPS Requirements
- HTTPS is mandatory for:
  - Secure cookie / token transmission.
  - Google OAuth consent redirection.
  - Cross-Origin Resource Sharing with Bearer tokens.
- Automatic SSL termination handled by Vercel and Render/Cloudflare.

---

## 11. Database Requirements
- **Preserved Baseline Users**:
  - Mirudhula (`jeyavelan68@gmail.com`, ID: 81) -> `ADMIN`
  - Shahid (`sm7510@srmist.edu.in`, ID: 1023) -> `INSTRUCTOR`
  - Mikasa (`mj0971@gmail.com`, ID: 1024) -> `STUDENT`
- **Preserved Course Catalog**: Exactly 9 canonical courses, 28 modules, 476 lessons, 36 quizzes, 180 questions, 720 options.
- **Connection Pooling**: Use Supabase Transaction Pooler (port 6543) or Session Pooler (port 5432) for high concurrent worker loads.
- **Row Level Security (RLS)**:
  - Currently, database access is mediated exclusively through FastAPI backend queries using the connection string.
  - Public tables do not expose PostgREST endpoints directly; future PostgREST direct client integration would require explicit tenant RLS policies.

---

## 12. AI Provider Configuration
- Default fallback `AI_PROVIDER=mock`: Generates deterministic, valid questions without requiring an external API key or outbound network traffic.
- Production enhancement `AI_PROVIDER=openai`: Requires valid `AI_API_KEY` (e.g. `OPENAI_API_KEY`) set securely in backend environment.

---

## 13. Post-Deployment Smoke-Test Checklist
After deployment is live, verify the following in production:
- [ ] `GET /api/v1/health` returns `200 OK` with `{"status": "ok"}`.
- [ ] Homepage `/` loads with all illustrations, fonts, and assets.
- [ ] Direct navigation to `/login` and `/register` loads cleanly without 404 (SPA rewrite check).
- [ ] Student signup with a test account immediately activates and allows sign-in.
- [ ] Instructor signup marks account as `PENDING` and redirects to `/pending-approval`.
- [ ] Admin login (`jeyavelan68@gmail.com`) can view `/admin/instructor-requests` and approve/reject.
- [ ] Course catalog `/courses` displays all 9 canonical courses.
- [ ] Quizzes `/student/quizzes` lists all 36 quizzes without error.
- [ ] Mock exam creation and submission generates score.
- [ ] Saved content page `/student/saved-content` functions without redirection loops.

---

## 14. Rollback Considerations
- If backend deployment encounters an error: Roll back to previous container/commit deployment instantly via provider dashboard.
- If frontend encounters an error: Revert Vercel deployment to previous production instant snapshot.
- Database: Database migrations are backward-compatible; no destructive column drops are present.

---

## 15. Security Checklist
- [x] No backend secrets bundled into Vite client (checked `VITE_*` namespace).
- [x] Zero hardcoded passwords, tokens, or private keys committed to Git.
- [x] `.env`, `backend/.env`, and `frontend/.env` strictly listed in `.gitignore`.
- [x] Public registration disallows `ADMIN` self-assignment.
- [x] Instructor accounts require manual Admin approval before accessing studio routes.
- [x] CORS restricted to verified frontend origin in production mode.
