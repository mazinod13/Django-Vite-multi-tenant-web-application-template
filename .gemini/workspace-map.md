# Workspace Map

## Build, Run, and Test Commands

### Backend (Django)
- **Start Development Server**: `python manage.py runserver`
- **Database Migrations**: `python manage.py migrate`
- **Create Superuser**: `python manage.py createsuperuser`

### Frontend (Vite / React)
- **Install Dependencies**: `cd frontend && npm install`
- **Start Dev Server**: `cd frontend && npm run dev`
- **Build Production Bundle**: `cd frontend && npm run build`

## Required Environment Variables
Specified in [`.env`](file:///D:/django_vite_web_app/Django-Vite-multi-tenant-web-application-template/.env):
- `SECRET_KEY`: Django secret key.
- `DEBUG`: Django debug mode (True/False).
- `DB_NAME`: PostgreSQL database name.
- `DB_USER`: PostgreSQL user.
- `DB_PASSWORD`: PostgreSQL password.
- `DB_HOST`: Database host.
- `DB_PORT`: Database port.
- `ALLOWED_HOSTS`: Allowed domains list.

## Directory Structure & Module Purposes

- `apps/` — Django application modules
  - `public/` — Shared public-facing applications (tenant creation/landing)
    - `tenants/` — Multi-tenant schema routing, domain mapping
      - `models.py` — Defines `Tenant` and `Domain` models (django-tenants)
      - `views.py` — Tenant registration and lookup views
  - `tenant/` — Tenant-specific applications (isolated in tenant schemas)
    - `api/` — API for school and restaurant apps
      - `views.py` — School, restaurant, and user management endpoints
      - `urls.py` — Routes for tenant endpoints
      - `serializers.py` — DRF serializers for API data
      - `models.py` — Database models for API resources
      - `authentication.py` — Custom multi-tenant JWT auth
    - `core/` — Common base models and views for all tenants
    - `users/` — Custom User and profile management for tenants
    - `school/` — Models and logic for school tenant databases (students, staff, classroom)
    - `restaurant/` — Models and logic for restaurant tenant databases (orders, menu, table)

- `config/` — Django configurations
  - `settings/` — Environment-based Django configurations
    - `base.py` — Shared multi-tenant config (using `django_tenants`), DRF setup
  - `urls.py` — Routing for tenant domains
  - `urls_public.py` — Routing for the public schema (landing pages)

- `frontend/` — React frontend application powered by Vite, Tailwind CSS, TypeScript, and shadcn/ui
  - `src/` — React source code
    - `apps/` — Target builds for public and specific tenant personas
      - `public/` — Public lander and registration app
      - `tenant/` — Tenant-specific client applications
        - `school/` — Portal for school workspace (students/teachers/roles management)
        - `restaurant/` — Portal for restaurant workspace (menus, inventory, orders)
    - `components/` — Shared React UI components and layouts
    - `lib/` — Shared libraries (Auth helper, Vite mount wrapper)
    - `hooks/` — React custom hooks

## Key Exports

- `frontend/src/lib/auth.ts`:
  - `getCurrentUser()`: Retrieve current logged-in user profile.
  - `isAuthenticated()`: Check if active session JWT exists.
- `frontend/src/lib/mount.tsx`:
  - `mountApp(AppNode)`: Utility to bootstrap standard React application context.
