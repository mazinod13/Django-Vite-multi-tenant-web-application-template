# Multi-Tenant SaaS Template — Django + Vite

A reusable foundation for building **multi-tenant** web applications (School, Restaurant, Library management, and beyond). Each tenant (customer) gets its own **isolated PostgreSQL schema** via [`django-tenants`](https://django-tenants.readthedocs.io/), with a Django REST API and a Vue + Vite frontend.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5.2 |
| Multi-tenancy | django-tenants (schema-per-tenant) |
| API | Django REST Framework + drf-spectacular (Swagger) |
| Frontend | Vite 5 + Vue 3 (via django-vite) |
| Database | PostgreSQL 15+ |
| Async (optional) | Celery + Redis |
| Config | django-environ (`.env`) |

---

## Prerequisites

Install these first:

| Tool | Version | Notes |
|------|---------|-------|
| **Python** | 3.11+ | Comes with the project `venv` once created |
| **PostgreSQL** | 15+ | Required — schema tenancy does **not** work on SQLite |
| **Node.js** | 18+ (20 LTS) | For the Vite frontend — `winget install -e --id OpenJS.NodeJS.LTS` |
| **Redis** | optional | Only for Celery background jobs (Step 8) — on Windows use Memurai/Docker/WSL |

### Installing PostgreSQL (Windows)

1. Download the installer: <https://www.enterprisedb.com/downloads/postgres-postgresql-downloads> → **PostgreSQL → Windows x86-64**.
2. Run the wizard. **Important screens:**
   - **Password** — set a password for the `postgres` superuser and **remember it**.
   - **Port** — keep `5432` (default).
   - Keep **pgAdmin 4** and **Command Line Tools** checked; skip *Stack Builder* at the end.
3. Verify it's running:
   ```powershell
   Get-Service -Name "postgresql*"      # Status should be: Running
   ```

> If `psql` isn't on your PATH, the full path is `C:\Program Files\PostgreSQL\<version>\bin\psql.exe`.

### Create the database

Using `psql` (adjust the path/version):
```powershell
$env:PGPASSWORD='<your-postgres-password>'
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE saas_template;"
```
…or create a database named **`saas_template`** in **pgAdmin** (right-click *Databases → Create → Database*).

---

## Setup

### 1. Clone and enter the project
```powershell
git clone <repo-url>
cd Django-Vite-multi-tenant-web-application-template
```

### 2. Create & activate a virtual environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1        # PowerShell
```
Your prompt should now show `(venv)`.

### 3. Install Python dependencies
```powershell
pip install -r requirements.txt
```

### 4. Install frontend dependencies
```powershell
cd frontend
npm install
cd ..
```

### 5. Create the `.env` file

Create a file named **`.env`** in the project root (next to `manage.py`):

```env
SECRET_KEY=replace-with-a-generated-key
DEBUG=True
DB_NAME=saas_template
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
```

Generate a secure `SECRET_KEY`:
```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

> `.env` holds secrets — it is **git-ignored** and must never be committed.

---

## Database Migrations

django-tenants splits migrations into **shared** (public schema) and **tenant** (per-schema):

```powershell
python manage.py makemigrations
python manage.py migrate_schemas --shared      # public schema (Tenant/Domain + shared apps)
```

---

## Create Tenants

Open the Django shell:
```powershell
python manage.py shell
```
```python
from apps.public.tenants.models import Tenant, Domain

# 1. The public tenant (the shared schema itself) — needed once.
public = Tenant(schema_name="public", name="Public", slug="public")
public.save()
Domain.objects.create(domain="localhost", tenant=public, is_primary=True)

# 2. A real tenant — this AUTO-CREATES a new PostgreSQL schema and runs tenant migrations.
school = Tenant(schema_name="sunrise", name="Sunrise School", slug="sunrise", category="school")
school.save()
Domain.objects.create(domain="sunrise.localhost", tenant=school, is_primary=True)

exit()
```

### Create a superuser for a tenant
The user table lives **per schema**, so target the tenant with `tenant_command`:
```powershell
python manage.py tenant_command createsuperuser --schema=sunrise
```

---

## Running the App

### Option A — one terminal (recommended), using honcho
```powershell
pip install honcho
honcho start
```
This runs Django **and** the Vite dev server together (config in `Procfile`). Press **Ctrl+C** to stop both.

### Option B — two terminals
```powershell
# Terminal 1 — Vite dev server (hot reload)
cd frontend
npm run dev

# Terminal 2 — Django
python manage.py runserver
```

### URLs (development)

Tenants are selected by **subdomain**. Modern browsers resolve `*.localhost` to `127.0.0.1` automatically.

| URL | What |
|-----|------|
| `http://sunrise.localhost:8000/` | Tenant dashboard (Vue) for the *sunrise* tenant |
| `http://sunrise.localhost:8000/admin/` | Django admin (scoped to the *sunrise* schema) |
| `http://sunrise.localhost:8000/api/` | DRF browsable API |
| `http://sunrise.localhost:8000/api/docs/` | Swagger / OpenAPI docs |
| `http://localhost:8000/` | The **public** schema (different data) |

> If `sunrise.localhost` won't resolve, add `127.0.0.1  sunrise.localhost` to `C:\Windows\System32\drivers\etc\hosts` (edit as Administrator).

---

## Project Structure

```
config/                  # Django project
  settings/              # base / development / production
  urls.py
apps/
  public/                # SHARED schema apps
    tenants/             # Tenant + Domain models
  tenant/                # PER-TENANT schema apps
    core/                # BaseModel (UUID pk, timestamps, soft-delete)
    users/               # Role + custom TenantUser
    api/                 # DRF serializers, viewsets, routes
frontend/                # Vite + Vue
  src/apps/public/       # public-site SPA entry
  src/apps/tenant/       # tenant-dashboard SPA entry
  vite.config.js
templates/               # Django HTML templates
.env                     # secrets (not committed)
Procfile                 # runs Django + Vite together (honcho)
cli.md                   # every command used, by phase
```

---

## Adding a New Business Domain (e.g. School / Restaurant / Library)

Each tenant has a `category` field. To add a vertical:

1. **Backend** — create a domain app and add it to `TENANT_APPS` in `config/settings/base.py`:
   ```powershell
   New-Item -ItemType Directory -Force apps\tenant\school | Out-Null
   django-admin startapp school apps\tenant\school
   ```
   Set `name = "apps.tenant.school"` in its `apps.py`, write models (all inheriting `apps.tenant.core.models.BaseModel`), then:
   ```powershell
   python manage.py makemigrations school
   python manage.py migrate_schemas          # applies to every tenant schema
   ```
2. **Frontend** — add a Vue entry `frontend/src/apps/tenant/school/main.js` and register it in `vite.config.js` `rollupOptions.input`.
3. **Wire by type** — the Django dashboard view loads the right Vue entry based on `request.tenant.category`.

See `MultiTenant_SaaS_Django_Vite_SOP.pdf` (Part 4) for model examples per domain.

---

## Production Notes (high level)

- `DEBUG=False`, real `SECRET_KEY`, `ALLOWED_HOSTS`/CORS set, HTTPS + secure cookies.
- `npm run build` in `frontend/`, then `python manage.py collectstatic` (django-vite serves the built manifest when `dev_mode=False`).
- `migrate_schemas --shared` then `migrate_schemas` for tenants.
- Wildcard DNS + SSL (`*.yourdomain.com`) routed by subdomain to Django.
- Run Celery worker/beat with Redis if using background jobs.

See the SOP's Part 5 (Pre-Launch Checklist) for the full list.
