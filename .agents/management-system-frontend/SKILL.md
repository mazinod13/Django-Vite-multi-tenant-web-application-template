---
name: management-system-frontend
description: Guides development of tenant management dashboards, data tables, role-based navigation, forms, and admin workflows for this Django + Vite multi-tenant application.
category: frontend
---

# Management System Frontend Skill

## Overview

This repository is a schema-per-tenant SaaS template built with:

- Django 5.2 + Django REST Framework + `django-tenants`
- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- Tenant-specific React apps under `frontend/src/apps/tenant/`

This UI is built from the Neobrutalism design system, so all frontend work should be checked against the Neobrutalism docs at `http://neobrutalism.dev/docs/`.

Use this skill when implementing or improving tenant admin dashboards, management pages, and school/restaurant workflows. The goal is to enforce structured, accessible, and production-grade management UI patterns that match the project docs and repository conventions.

---

## 🏗️ Layout & Role-Based Navigation

1. **Tenant-aware page structure**
   - Keep school tenant pages under `frontend/src/apps/tenant/school/pages/`
   - Keep restaurant tenant sections under `frontend/src/apps/tenant/restaurant/sections/`
   - Use the existing route structure from `frontend/src/apps/tenant/school/App.tsx`

2. **Role-based context**
   - Protect admin workflows using auth/role state in tenant pages.
   - Restrict actions and navigation based on tenant user roles, such as `Admin`, `Staff`, `Teacher`, `Manager`, or `Employee`.

3. **Responsive dashboard layout**
   - Desktop: sidebar/navigation + top header + content canvas.
   - Mobile: collapsible drawer or mobile menu.
   - Keep the main canvas scrollable and the header sticky when appropriate.

4. **Status badges and visual states**
   - Use consistent badge colors for roles/statuses.
   - E.g. active/published as green, pending/idle as blue, suspended/overdue as red.

---

## 📊 Data Tables & Grid Systems

Data tables are central to management screens. Implement them with strong accessibility and usability.

### 1. Table structure

- Wrap tables in `overflow-x-auto` containers.
- Use clear header styles, alternate row states, and accessible table semantics.
- Support sorting icons on sortable columns.

### 2. Search and filter bar

- Place search, filter dropdowns, dates, and status chips above table content.
- Allow resetting filters with a visible action.
- Debounce search input to reduce API load.

### 3. Pagination controls

- Show current row range and total item count.
- Implement `Previous` / `Next` controls and page size selection.
- Keep pagination accessible and keyboard-friendly.

### 4. Row actions

- Use compact action menus for edit/delete/status changes.
- Avoid multiple primary buttons in a row.
- For destructive actions, require explicit confirmation.

---

## 📝 Form Architecture & Data Entry

Forms must be robust, validated, and aligned with the repo's UI primitives.

1. **Responsive form grids**
   - Use `grid-cols-1 md:grid-cols-2` or `grid-cols-3` for compact form layouts.
   - Group related fields logically.

2. **Validation and feedback**
   - Enforce required fields, email format, numeric ranges, and custom business rules.
   - Show inline error messages, helper text, and `aria-describedby` for accessibility.
   - Disable submit buttons during form submission and show loading state.

3. **Multi-step workflows**
   - Use stepper-like progress when onboarding users, creating classes, or managing menus.
   - Preserve state across steps so users can navigate back without losing input.

4. **Use existing UI components**
   - Prefer `Button`, `Input`, `Card`, and other components from `frontend/src/components/ui/`.
   - Keep styling consistent with the rest of the tenant app.

---

## 🏫 Domain-Specific Patterns

### 🎓 School Management

- **Dashboard**: key metrics, attendance summary, quick links to `Students`, `Academics`, and `Administration`.
- **Students**: searchable student list, filters, status, and quick-actions.
- **Administration**: role/user management, staff CRUD, and tenant-level control panel.
- **Academics**: class schedule, grades, curriculum planning, and course metadata.

### 🍽️ Restaurant Management

- **Menu management**: item list, category filters, availability status, and pricing updates.
- **Orders**: order status board, table assignments, and quick order actions.
- **Reservations**: reservation search, date/time filters, and staff assignment.
- **Inventory**: stock levels, reorder alerts, and supplier metadata.

---

## 🔄 Client State & API Sync

Tenant data should stay in sync with the Django backend and use client-side caching patterns when possible.

- **Fetch hooks**: read from tenant-scoped APIs and avoid public-schema data in tenant views.
- **Optimistic updates**: update UI immediately for fast actions, then roll back on error.
- **Safe deletion**: require confirmation modals or explicit text inputs for destructive operations.
- **Error handling**: show clear server/validation error messages in the UI.

---

## 📚 Repo-Specific Guidance

- Use `PROJECT_MAP.md` as the source of truth for where frontend and backend pieces live.
- For page-level changes, start in `frontend/src/apps/tenant/`.
- For API/backend contract changes, inspect `apps/tenant/api/` and tenant models under `apps/tenant/`.
- Preserve the multi-tenant story: each tenant has isolated schema data, so UI flows should behave as tenant-scoped management dashboards.

---

## 🛠️ Verification Hook

Since the repo does not include a dedicated `scripts.py` validation script, verify management UI changes by:

- Running `cd frontend && npm run build`
- Confirming the new page compiles without TypeScript or Tailwind errors
- Confirming the tenant route works in the browser at `http://<tenant>.localhost:5173/` or via the Django tenant host
- Checking the relevant route file in `frontend/src/apps/tenant/school/App.tsx` and any new page files under `frontend/src/apps/tenant/`

---

## Output Template

When designing or implementing management screens, document your interface schema as follows:

```markdown
### 📋 Interface Structure & Specs

- **Target Management Domain**: [School Portal / Restaurant Management / Inventory / Registry]
- **Target User Roles**: [Admin / Staff / Teacher / Manager / Employee]
- **Key Visual Layouts**: [Sidebar navigation, stats grid, data table, form canvas, etc.]

### ♿ Form & Table Validation Checklist

| Field/Component           | Validation Rules                | Error State Styling           | Accessibility Role               |
| :------------------------ | :------------------------------ | :---------------------------- | :------------------------------- |
| [e.g. Student Name Input] | Required, Min 3 chars           | `text-red-500 border-red-500` | `<input aria-required="true" />` |
| [e.g. Enrollment Table]   | Paginated, Sortable, Searchable | Dynamic empty states          | `<table role="grid" />`          |

### 🛠️ Client State & Mutation Sync

- **Fetch Hook**: `useQuery(['resource', filters])`
- **Mutation Handler**: `useMutation(updateResource, { onMutate: ... })`
- **Confirmation Flow**: [Explain confirmation mechanism for deletions or status updates]
```
