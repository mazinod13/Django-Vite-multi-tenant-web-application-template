# Project Map

This file is the quick reference for where to make changes in this project.
It focuses on source files and intentionally ignores generated folders like `frontend/node_modules/`, `venv/`, and `__pycache__/`.

## Root

- [`manage.py`](manage.py): Django entry point for management commands.
- [`requirements.txt`](requirements.txt): Python dependencies.
- [`README.md`](README.md): Setup and project overview.
- [`cli.md`](cli.md): Command history and useful command notes.
- [`.env`](.env): Local secrets and environment-specific settings.
- [`Procfile`](Procfile): Process definition for deployment.
- [`LEARNING_PATH.md`](LEARNING_PATH.md): Walkthrough guide of studied architectural components and custom command scripts.

## Django Config

- [`config/settings/base.py`](config/settings/base.py): Shared Django settings, multi-tenant configuration, DRF, JWT, Vite integration.
- [`config/settings/development.py`](config/settings/development.py): Development overrides.
- [`config/settings/production.py`](config/settings/production.py): Production overrides.
- [`config/urls.py`](config/urls.py): Main URL routing.
- [`config/urls_public.py`](config/urls_public.py): Public-schema URL routing.
- [`config/asgi.py`](config/asgi.py): ASGI entry point.
- [`config/wsgi.py`](config/wsgi.py): WSGI entry point.

## Public App

### `apps/public/tenants`

- [`apps/public/tenants/models.py`](apps/public/tenants/models.py): Public tenant and domain models.
- [`apps/public/tenants/admin.py`](apps/public/tenants/admin.py): Admin registration for tenant models.
- [`apps/public/tenants/views.py`](apps/public/tenants/views.py): Public-side views.
- [`apps/public/tenants/apps.py`](apps/public/tenants/apps.py): App config.
- [`apps/public/tenants/migrations/0001_initial.py`](apps/public/tenants/migrations/0001_initial.py): Initial tenant schema migration.
- [`apps/public/tenants/migrations/0002_tenant_category.py`](apps/public/tenants/migrations/0002_tenant_category.py): Tenant category migration.

## Tenant Apps

### `apps/tenant/api`

- [`apps/tenant/api/views.py`](apps/tenant/api/views.py): Tenant API endpoints.
- [`apps/tenant/api/urls.py`](apps/tenant/api/urls.py): API URL routes.
- [`apps/tenant/api/serializers.py`](apps/tenant/api/serializers.py): DRF serializers.
- [`apps/tenant/api/models.py`](apps/tenant/api/models.py): API-related models.
- [`apps/tenant/api/auth.py`](apps/tenant/api/auth.py): Authentication helpers.
- [`apps/tenant/api/authentication.py`](apps/tenant/api/authentication.py): Custom JWT authentication.
- [`apps/tenant/api/admin.py`](apps/tenant/api/admin.py): Admin registration.
- [`apps/tenant/api/apps.py`](apps/tenant/api/apps.py): App config.

### `apps/tenant/core`

- [`apps/tenant/core/models.py`](apps/tenant/core/models.py): Shared tenant base models.
- [`apps/tenant/core/views.py`](apps/tenant/core/views.py): Core tenant views.
- [`apps/tenant/core/admin.py`](apps/tenant/core/admin.py): Admin registration.

### `apps/tenant/users`

- [`apps/tenant/users/models.py`](apps/tenant/users/models.py): Custom tenant user model.
- [`apps/tenant/users/views.py`](apps/tenant/users/views.py): Tenant user views.
- [`apps/tenant/users/admin.py`](apps/tenant/users/admin.py): Admin registration.
- [`apps/tenant/users/apps.py`](apps/tenant/users/apps.py): App config.
- [`apps/tenant/users/migrations/0001_initial.py`](apps/tenant/users/migrations/0001_initial.py): Initial user migration.

### `apps/tenant/school`

- [`apps/tenant/school/models.py`](apps/tenant/school/models.py): School tenant models.
- [`apps/tenant/school/views.py`](apps/tenant/school/views.py): School tenant views.
- [`apps/tenant/school/admin.py`](apps/tenant/school/admin.py): Admin registration.

### `apps/tenant/restaurant`

- [`apps/tenant/restaurant/models.py`](apps/tenant/restaurant/models.py): Restaurant tenant models.
- [`apps/tenant/restaurant/views.py`](apps/tenant/restaurant/views.py): Restaurant tenant views.
- [`apps/tenant/restaurant/admin.py`](apps/tenant/restaurant/admin.py): Admin registration.

## Templates

- [`templates/public/landing.html`](templates/public/landing.html): Public landing page template.
- [`templates/tenant/dashboard.html`](templates/tenant/dashboard.html): Tenant dashboard template.

## Frontend

### Vite / React app setup

- [`frontend/package.json`](frontend/package.json): Frontend dependencies and scripts.
- [`frontend/vite.config.js`](frontend/vite.config.js): Vite configuration.
- [`frontend/tsconfig.json`](frontend/tsconfig.json): TypeScript configuration.
- [`frontend/components.json`](frontend/components.json): shadcn/ui component config.

### Global styles

- [`frontend/src/styles/globals.css`](frontend/src/styles/globals.css): Global CSS and Tailwind-related styling.

### Frontend libraries and hooks

- [`frontend/src/lib/auth.ts`](frontend/src/lib/auth.ts): Auth/session helpers and user typing.
- [`frontend/src/lib/mount.tsx`](frontend/src/lib/mount.tsx): Tenant app mounting helper.
- [`frontend/src/lib/utils.ts`](frontend/src/lib/utils.ts): Shared utility helpers.
- [`frontend/src/hooks/use-mobile.ts`](frontend/src/hooks/use-mobile.ts): Mobile breakpoint hook.

### App entry points

- [`frontend/src/apps/public/main.tsx`](frontend/src/apps/public/main.tsx): Public frontend entry.
- [`frontend/src/apps/public/App.tsx`](frontend/src/apps/public/App.tsx): Public app UI.
- [`frontend/src/apps/tenant/school/main.tsx`](frontend/src/apps/tenant/school/main.tsx): School tenant entry.
- [`frontend/src/apps/tenant/school/App.tsx`](frontend/src/apps/tenant/school/App.tsx): School tenant UI.
- [`frontend/src/apps/tenant/restaurant/main.tsx`](frontend/src/apps/tenant/restaurant/main.tsx): Restaurant tenant entry.
- [`frontend/src/apps/tenant/restaurant/App.tsx`](frontend/src/apps/tenant/restaurant/App.tsx): Restaurant tenant UI.
- [`frontend/src/apps/tenant/reset/main.tsx`](frontend/src/apps/tenant/reset/main.tsx): Reset password entry.

### Tenant feature sections

- [`frontend/src/apps/tenant/restaurant/sections/MenuSection.tsx`](frontend/src/apps/tenant/restaurant/sections/MenuSection.tsx): Restaurant menu management section.
- [`frontend/src/apps/tenant/restaurant/sections/OrdersSection.tsx`](frontend/src/apps/tenant/restaurant/sections/OrdersSection.tsx): Restaurant orders section.
- [`frontend/src/apps/tenant/restaurant/sections/ReservationsSection.tsx`](frontend/src/apps/tenant/restaurant/sections/ReservationsSection.tsx): Restaurant reservations section.
- [`frontend/src/apps/tenant/restaurant/sections/TablesSection.tsx`](frontend/src/apps/tenant/restaurant/sections/TablesSection.tsx): Restaurant table management section.
- [`frontend/src/apps/tenant/restaurant/sections/InventorySection.tsx`](frontend/src/apps/tenant/restaurant/sections/InventorySection.tsx): Restaurant inventory section.

### Shared components

- [`frontend/src/components/AuthGate.tsx`](frontend/src/components/AuthGate.tsx): Authentication gate / protected rendering.
- [`frontend/src/components/ResetPasswordPage.tsx`](frontend/src/components/ResetPasswordPage.tsx): Reset password screen.
- [`frontend/src/components/ui/AuthPage.tsx`](frontend/src/components/ui/AuthPage.tsx): Auth page layout/component.
- [`frontend/src/components/ui/button.tsx`](frontend/src/components/ui/button.tsx): Button component.
- [`frontend/src/components/ui/input.tsx`](frontend/src/components/ui/input.tsx): Input component.
- [`frontend/src/components/ui/card.tsx`](frontend/src/components/ui/card.tsx): Card component.
- [`frontend/src/components/ui/tabs.tsx`](frontend/src/components/ui/tabs.tsx): Tabs component.
- [`frontend/src/components/ui/alert-dialog.tsx`](frontend/src/components/ui/alert-dialog.tsx): Alert dialog component.
- [`frontend/src/components/ui/sheet.tsx`](frontend/src/components/ui/sheet.tsx): Sheet / drawer component.
- [`frontend/src/components/ui/sidebar.tsx`](frontend/src/components/ui/sidebar.tsx): Sidebar component.
- [`frontend/src/components/ui/skeleton.tsx`](frontend/src/components/ui/skeleton.tsx): Skeleton loading component.
- [`frontend/src/components/ui/tooltip.tsx`](frontend/src/components/ui/tooltip.tsx): Tooltip component.
- [`frontend/src/components/ui/marquee.tsx`](frontend/src/components/ui/marquee.tsx): Marquee component.

## Fast Lookup

- Django settings or app registration: [`config/settings/base.py`](config/settings/base.py)
- Public tenant data model changes: [`apps/public/tenants/models.py`](apps/public/tenants/models.py)
- Tenant user/auth changes: [`apps/tenant/users/models.py`](apps/tenant/users/models.py) and [`apps/tenant/api/authentication.py`](apps/tenant/api/authentication.py)
- API endpoint changes: [`apps/tenant/api/views.py`](apps/tenant/api/views.py) and [`apps/tenant/api/urls.py`](apps/tenant/api/urls.py)
- Frontend page changes: files under [`frontend/src/apps/`](frontend/src/apps)
- Shared frontend UI changes: files under [`frontend/src/components/`](frontend/src/components)

## Notes

- If you ask for a change later, I should start by checking this file, then only open the specific files listed here.
- If the project structure changes, this file should be updated first so it stays useful as the navigation index.
