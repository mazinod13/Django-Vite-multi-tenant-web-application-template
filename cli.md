# CLI & Command Reference

Every command/CLI used while building this multi-tenant SaaS template, in order, with what each was for.
Shell: **PowerShell** on Windows, inside the project `venv`.

---

## 0. Prerequisite checks

| Command | Purpose |
|---------|---------|
| `python --version` | Confirm Python is installed (came with the venv). |
| `node --version` / `npm --version` | Check Node.js for the Vite frontend (Step 6). |
| `psql --version` | Check the PostgreSQL client (was missing → not on PATH). |
| `redis-cli --version` | Check Redis (needed later for Celery, Step 8). |

---

## 1. PostgreSQL setup (the install/reinstall saga)

| Command | Purpose |
|---------|---------|
| `Get-ChildItem "C:\Program Files\PostgreSQL"` | Check whether/where PostgreSQL is installed. |
| `winget install -e --id PostgreSQL.PostgreSQL.17` | Install PostgreSQL via winget (silent — caused unknown-password issue). |
| `Get-Service -Name "postgresql*"` | List PostgreSQL Windows services and their Running/Stopped status. |
| `Get-Service \| Where-Object { $_.DisplayName -like "*postgres*" }` | Wider search for the service by display name. |
| `Get-NetTCPConnection -LocalPort 5432,5433 -State Listen` | Find which ports PostgreSQL is listening on (had v17 + v18). |
| `Get-CimInstance Win32_Service \| Where-Object {...}` | Map service → process ID → install path (version). |
| `Get-Content "...\18\data\postgresql.conf" \| Select-String "^port"` | Read each server's configured port (v18 = 5432, v17 = 5433). |
| `Stop-Service postgresql-x64-18` | Stop the v18 service. |
| `sc.exe delete postgresql-x64-18` | Remove a leftover (ghost) service registration after uninstall. |
| `Remove-Item "C:\Program Files\PostgreSQL" -Recurse -Force` | Delete leftover install/data folders for a clean reinstall. |
| `& "C:\Program Files\PostgreSQL\18\uninstall-postgresql.exe"` | Run the official uninstaller. |

### After the clean GUI reinstall (password set to `root`, port 5432)

| Command | Purpose |
|---------|---------|
| `$env:PGPASSWORD='root'` | Set password env var so psql doesn't prompt. |
| `& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5432 -c "SELECT version();"` | Verify login + see server version. |
| `... -c "CREATE DATABASE saas_template;"` | Create the project database. |
| `... -c "\l"` | List all databases (confirm `saas_template` exists). |
| `... -d saas_template -c "\dn"` | List schemas in the DB (confirm `public` + `sunrise` tenant schemas). |

> **Gotcha learned:** `Set-Content` on Windows PowerShell saves as UTF-16, which corrupts `pg_hba.conf` and stops the service. Use `Set-Content ... -Encoding ascii` when editing Postgres config files.

---

## 2. Python / Django environment

| Command | Purpose |
|---------|---------|
| `.\venv\Scripts\Activate.ps1` | Activate the virtual environment (prompt shows `(venv)`). |
| `pip list` | List installed packages (Django, django-tenants, DRF, etc. were pre-installed). |
| `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` | Generate a secure `SECRET_KEY` for `.env`. |

---

## 3. Django project & app scaffolding

| Command | Purpose |
|---------|---------|
| `django-admin startproject config .` | Create the Django project (`config/` package + `manage.py`) in the current folder (note the trailing `.`). |
| `Move-Item "config\config\settings" "config\settings"` | Fix the settings package that was created one level too deep. |
| `Remove-Item "config\config" -Recurse -Force` | Remove the leftover nested folder. |
| `Remove-Item "config\settings.py"` | Delete the original single settings file (replaced by the settings package). |
| `New-Item -ItemType Directory -Force apps, apps\public, apps\tenant` | Create the app package folders. |
| `New-Item -ItemType File apps\__init__.py` (etc.) | Add `__init__.py` markers so folders are Python packages. |
| `django-admin startapp tenants apps\public\tenants` | Generate the `tenants` app (used `django-admin`, not `manage.py`, so it skips loading settings). |
| `django-admin startapp core apps\tenant\core` | Generate the `core` app (BaseModel). |
| `django-admin startapp users apps\tenant\users` | Generate the `users` app (Role, TenantUser). |
| `django-admin startapp api apps\tenant\api` | Generate the `api` app (DRF serializers/views). |

> After each `startapp`, edit the app's `apps.py` → set `name` to the full dotted path (e.g. `apps.public.tenants`).

---

## 4. Migrations & running the app

| Command | Purpose |
|---------|---------|
| `python manage.py makemigrations` | Create migration files from the models. Also the first full load of settings (validates config). |
| `python manage.py migrate` | Apply migrations to the **public** schema (django-tenants routes this). |
| `python manage.py migrate_schemas --shared` | (Correct django-tenants way) apply `SHARED_APPS` to the public schema. |
| `python manage.py migrate_schemas` | Apply `TENANT_APPS` to every tenant schema. |
| `python manage.py shell` | Open the Django shell — used to create the public tenant + first real tenant (`sunrise`). |
| `python manage.py tenant_command createsuperuser --schema=sunrise` | Create a superuser **inside a specific tenant's schema** (django-tenants command). |
| `python manage.py runserver` | Start the dev server at `http://127.0.0.1:8000/`. |

---

## 5. Useful URLs (dev)

| URL | Purpose |
|-----|---------|
| `http://sunrise.localhost:8000/admin/` | Admin for the **sunrise** tenant (subdomain selects the schema). |
| `http://sunrise.localhost:8000/api/` | DRF browsable API (tenant-scoped). |
| `http://sunrise.localhost:8000/api/docs/` | Swagger / OpenAPI docs. |
| `http://localhost:8000/...` | Same paths but the **public** schema (different data). |

---

## 6. Frontend (Vite + React + TypeScript) — Step 6

| Command | Purpose |
|---------|---------|
| `node --version` / `npm --version` | Confirm Node 20 / npm 10 are installed. |
| `cd frontend; npm install` | Install frontend deps from `package.json`. |
| `npm run dev` | Start the Vite dev server (port 5173) with hot-reload — run alongside `runserver`. |
| `npm run build` | (Production) build optimized bundles into `frontend/dist/` + `manifest.json`. Also handy to verify React/TS compiles. |

> **Dev flow:** use `honcho start` (section 7), or two terminals.
> django-vite (`dev_mode=DEBUG`) loads assets from `http://localhost:5173/static/...`, so Vite `base` must be `/static/` (matches `STATIC_URL`).

### Switching the frontend from Vue to React + TypeScript

| Command | Purpose |
|---------|---------|
| `npm uninstall vue @vitejs/plugin-vue` | Remove Vue. |
| `npm install react react-dom` | Install React. |
| `npm install -D "@vitejs/plugin-react@^4" typescript @types/react @types/react-dom` | React Vite plugin + TS types. Pin plugin-react `^4` (v6 needs Vite 8; we're on Vite 5). |

Also: add `tsconfig.json`, swap `vue()` -> `react()` in `vite.config.js`, change entries `main.js`/`App.vue` -> `main.tsx`/`App.tsx`, point the Django view's `vite_entry` at `main.tsx`, and add `{% vite_react_refresh %}` before `{% vite_asset %}` in the template (React HMR preamble). django-vite is framework-agnostic, so no other Django changes.

### Tailwind CSS v4 + shadcn/ui

| Command | Purpose |
|---------|---------|
| `npm install class-variance-authority clsx tailwind-merge radix-ui lucide-react` | shadcn component runtime deps (variants, class merge, primitives, icons). |
| `npm install -D tailwindcss @tailwindcss/vite` | Tailwind v4 + its Vite plugin. |

Wiring (no `tailwind.config.js` needed in v4):
- `vite.config.js`: add `tailwindcss()` to plugins and a `resolve.alias` mapping `@` -> `src` (`path.resolve(import.meta.dirname,'src')`).
- `tsconfig.json`: add `paths` `{ "@/*": ["./src/*"] }` (no `baseUrl` — deprecated in TS 6).
- `src/styles/globals.css`: `@import "tailwindcss";` + `:root`/`.dark` design tokens + `@theme inline` mapping (`--color-primary`, `--radius-*`, ...). Import it at the top of every `main.tsx`.
- `src/lib/utils.ts`: `cn()` = `twMerge(clsx(...))`.
- Drop shadcn components into `src/components/ui/` and import via `@/components/ui/<name>`.

---

## 7. Run both servers from one terminal (honcho)

| Command | Purpose |
|---------|---------|
| `pip install honcho` | Install the Procfile process runner. |
| `honcho start` | Run Django + Vite together (reads `Procfile`); Ctrl+C stops both. |

`Procfile` contents:
```
web: python manage.py runserver
vite: npm --prefix frontend run dev
```

### Freeing stuck ports (orphaned runserver / vite)

```powershell
Get-NetTCPConnection -LocalPort 8000,5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## 8. Domain verticals (school / restaurant) — SOP Part 4

| Command | Purpose |
|---------|---------|
| `django-admin startapp school apps\tenant\school` | Create the school vertical app (then set dotted `name` in apps.py). |
| `django-admin startapp restaurant apps\tenant\restaurant` | Create the restaurant vertical app. |
| `python manage.py makemigrations school` (and `restaurant`) | Build migrations for the new vertical models. |
| `python manage.py migrate_schemas` | Apply tenant-app migrations into **every** tenant schema. |
| `python manage.py check` | Validate config (caught an `admin.E108` list_display typo). |

> Per-tenant GUI: `core/views.dashboard` reads `request.tenant.category` and loads `src/apps/tenant/<category>/main.js` via `{% vite_asset vite_entry %}`. All schemas hold all apps; `category` only controls what each UI shows.

## 9. JWT auth (djangorestframework-simplejwt) — tenant-aware

| Command | Purpose |
|---------|---------|
| `pip install djangorestframework-simplejwt` | JWT for DRF. |
| `python manage.py migrate_schemas` | Create `token_blacklist` tables in every tenant schema (for logout). |
| `python manage.py tenant_command changepassword <user> --schema=sunrise` | Set a known password for a tenant user. |

Endpoints (all under `/api/`): `token/` (login), `token/refresh/`, `token/verify/`, `logout/` (blacklist refresh), `me/` (protected).

Security: tokens carry a `tenant` claim (schema name); `TenantJWTAuthentication` rejects tokens whose claim != current schema (in `apps/tenant/api/authentication.py`, kept separate from `auth.py` to avoid a circular import at settings-load). Token minting + logout/me views in `apps/tenant/api/auth.py`.

Quick test (PowerShell, server running):
```powershell
$body = @{ username="admin"; password="..." } | ConvertTo-Json
$tokens = Invoke-RestMethod http://sunrise.localhost:8000/api/token/ -Method Post -Body $body -ContentType application/json
Invoke-RestMethod http://sunrise.localhost:8000/api/me/ -Headers @{ Authorization = "Bearer $($tokens.access)" }
```

## 10. Frontend auth UI (React) + gotchas

- `src/lib/auth.ts` — token client (login/logout/register/requestPasswordReset/authFetch w/ refresh-on-401/fetchMe); tokens in localStorage.
- `src/components/ui/AuthPage.tsx` — tabbed Login / Sign up / Forgot (Card + Tabs + Input + Button).
- `src/components/AuthGate.tsx` — gate: `fetchMe()` on load -> show AuthPage (logged out) or dashboard + Logout (logged in). Wrap each dashboard `App.tsx` in `<AuthGate>`.

**CSRF gotcha:** with `SessionAuthentication` in `DEFAULT_AUTHENTICATION_CLASSES`, anonymous browser POSTs (signup) fail with "CSRF Failed" when a session cookie exists (from admin login). Fix for a JWT SPA: make auth **JWT-only** (remove `SessionAuthentication` from defaults). Browsable API then needs a Bearer token (use Swagger's Authorize at `/api/docs/`).

**Password reset page:** new Vite entry `src/apps/tenant/reset/main.tsx` -> `ResetPasswordPage` (reads `uid`/`token` from URL, POSTs `/api/password-reset/confirm/`). Django `reset_password` view renders `dashboard.html` with that entry; route `path("reset-password", ...)`.

**Logout + Back button (bfcache) gotcha:** after logout, pressing Back/Forward can restore the cached logged-in page. `@never_cache` alone isn't enough (modern Chrome bfcaches `no-store`). Fix: in `AuthGate`, add a `pageshow` listener and `window.location.reload()` when `e.persisted` (forces a fresh load -> re-checks auth -> login).

**Duplicate components gotcha:** run `npx shadcn add` from `frontend/` (where `components.json` is), else it creates a duplicate tree (e.g. `src/apps/tenant/components/`). Canonical dir is `src/components/` (`@` = `src`).

**Stale-server gotcha (recurring):** after editing urls/views, if you get a 404 for a route that's clearly in the file, an orphaned `runserver` is serving old code. Kill all on 8000 and restart:
```powershell
Get-NetTCPConnection -LocalPort 8000,5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## Pending (not yet used)

| Command | Will be for |
|---------|-------------|
| Redis install (Memurai / Docker / WSL) | Redis for Celery + caching (Step 8). |
| `celery -A config worker -l info` | Run the Celery worker (Step 8). |
| `celery -A config beat -l info` | Scheduled tasks (Step 8). |
| `docker compose up` | Containerized stack (Step 9). |
