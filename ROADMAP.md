# Restaurant SaaS — Development Phases

Branch: `saas-restaurant-v1.0`. One tenant = one restaurant business, isolated in its own
PostgreSQL schema via django-tenants.

Each phase has a **goal**, the **changes** it touches, the **commands** to run, and an
**exit criterion** you can actually check. Do not start a phase until the previous one's
exit criterion passes.

---

## Current state

**Working:** multi-tenancy, tenant-aware JWT auth (login/register/logout/refresh/reset),
sidebar dashboard shell with react-router, platform-admin SPA on the bare domain, and a
Bikram Sambat `CalendarEvent` model + API kept for later holiday-pricing rules.

**Placeholder:** `Table`, `MenuItem`, `Order`, `OrderItem`, `Reservation`, `Inventory` in
[apps/tenant/restaurant/models.py](apps/tenant/restaurant/models.py) — models only, no API,
no UI. The five React sections are stubs.

**Data:** all restaurant tables are empty across every tenant schema. Only users exist
(3 in `sunrise`, 2 in `yums`). This is why Phase 2 and 3 can rebuild models freely.

---

## The five decisions these phases assume

Locked before any module, because each is cheap now and expensive once tenant schemas hold
live data — every change replays across every restaurant's schema.

**D1. Snapshot prices on the order line.** `OrderItem.subtotal` currently reads
`menu_item.price` live, so raising a price silently rewrites every historical order and
receipt. Store `unit_price` and `name_snapshot` frozen at order time; store `Order` totals
as columns computed once on finalize. Never recompute a closed order.

**D2. `Branch` exists from day one**, auto-created as "Main". Tenant is the *business*,
branches are rows inside it. `Branch` becomes an FK on `Table`, `Order`, `Inventory`, and
staff. Retrofitting that onto six populated tables later is the painful path.

**D3. Tax is a table, not a constant.** Nepal is 13% VAT plus a 10% service charge, and the
service charge is itself taxed. A `TaxRate` row (percent, is_compound, applies_to) survives
a second market; a hardcoded `0.13` does not.

**D4. RBAC via `Role.slug`** with fixed choices (owner/manager/waiter/chef/cashier), not the
currently-unused `auth.Permission` M2M. Seed roles on tenant creation.

**D5. Django Channels + Redis** for the kitchen display. Decided up front because it moves
the app to ASGI, which is a much bigger change once orders already ship over plain HTTP.

---

## Phase 0 — Housekeeping

**Goal:** clean slate, nothing stale left from the school era.

**Changes:**
- Drop the orphaned `school_*` tables and their migration rows (the code is gone, the tables
  are not).
- Decide what happens to the `sunrise` tenant — it was the school demo. Either drop it or
  keep it as a second restaurant for testing tenant isolation. Keeping one extra tenant is
  genuinely useful: isolation bugs only show up with two tenants.

```sql
-- per tenant schema
DROP TABLE IF EXISTS sunrise.school_attendance, sunrise.school_student, sunrise.school_classroom CASCADE;
DELETE FROM sunrise.django_migrations WHERE app = 'school';

DROP TABLE IF EXISTS yums.school_attendance, yums.school_student, yums.school_classroom CASCADE;
DELETE FROM yums.django_migrations WHERE app = 'school';
```

**Exit:** `SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'school_%';`
returns nothing.

---

## Phase 1 — Foundation and tenant bootstrap

**Goal:** a newly created tenant comes up immediately usable — one branch, seeded roles, an
owner account — instead of an empty schema you have to hand-configure.

This phase is D2, D3, D4 turned into tables. No user-facing feature ships here, and that is
fine; everything after it depends on this being right.

**Changes — [apps/tenant/core/models.py](apps/tenant/core/models.py)** (cross-cutting, so it
belongs in `core`, not `restaurant`):

```python
class Branch(BaseModel):
    name, address, phone, timezone (default "Asia/Kathmandu"), is_active

class TenantSettings(BaseModel):        # one row per schema
    currency (default "NPR"), currency_symbol, service_charge_percent,
    invoice_prefix, opening_time, closing_time

class TaxRate(BaseModel):               # D3
    name, percent, is_compound, applies_to, is_active

class AuditLog(BaseModel):              # add now — you cannot backfill history
    actor (FK TenantUser, SET_NULL), action, model_name,
    object_id (UUID), changes (JSON), ip_address
```

**Changes — [apps/tenant/users/models.py](apps/tenant/users/models.py):**
- `Role.slug` with fixed choices (D4) and a `ROLE_SLUGS` constant.
- `TenantUser.branch` FK (nullable — owners span branches).

**Changes — tenant provisioning.** Right now
[TenantSerializer.create](apps/public/tenants/views.py) only makes the schema and the domain.
Add a `bootstrap_tenant()` that seeds Main branch, default roles, settings, and default tax
rates. It must run *inside* the new schema:

```python
from django_tenants.utils import schema_context

tenant.save()                          # creates schema + runs tenant migrations
Domain.objects.create(domain=domain_name, tenant=tenant, is_primary=True)
with schema_context(tenant.schema_name):
    bootstrap_tenant(tenant)           # branch, roles, settings, tax rates
```

**Commands:**
```powershell
python manage.py makemigrations core users
python manage.py migrate_schemas
```

**Exit:** create a tenant from the platform-admin page, sign up on its subdomain, and confirm
the account lands with a role and a branch attached.

---

## Phase 2 — Menu

**Goal:** first full vertical slice — model to migration to serializer to viewset to URL to
React. Build it carefully; every module after this copies its shape.

**Changes — replace the flat `MenuItem`:**

```python
class MenuCategory(BaseModel):     # Starters, Mains, Drinks
    name, sort_order, is_active

class MenuItem(BaseModel):
    category (FK), name, description, image, base_price,
    is_available (the "86'd" toggle), sort_order

class MenuVariant(BaseModel):      # Small / Medium / Large
    menu_item (FK), name, price_delta

class ModifierGroup(BaseModel):    # "Choose a sauce"
    name, min_select, max_select, is_required

class Modifier(BaseModel):         # Extra cheese +50
    group (FK), name, price_delta
```

**Rebuilding the migration.** Because every restaurant table is empty, do not write forward
migrations for this reshape — squash instead:

```powershell
# 1. drop restaurant tables in EVERY tenant schema, e.g.
#    DROP TABLE sunrise.restaurant_orderitem, sunrise.restaurant_order, ... CASCADE;
#    DELETE FROM sunrise.django_migrations WHERE app = 'restaurant';
# 2. delete apps/tenant/restaurant/migrations/0001_initial.py
python manage.py makemigrations restaurant
python manage.py migrate_schemas
```

> This shortcut is available exactly once. The moment a real restaurant has data, every
> model change becomes a forward migration, forever. Note the date you stop using it.

**Backend:** `serializers.py` (nest variants and modifier groups inside the item so the POS
fetches a whole menu in one request), viewsets inheriting `TenantBaseViewSet` from
[apps/tenant/api/views.py](apps/tenant/api/views.py) (you get soft-delete filtering and
`IsAuthenticated` free), a new `apps/tenant/restaurant/urls.py` included at
`/api/restaurant/` in [config/urls.py](config/urls.py), and admin registration so you can
seed without a UI.

**Frontend:** `frontend/src/lib/api.ts` — typed wrappers over the existing `authFetch` in
[frontend/src/lib/auth.ts](frontend/src/lib/auth.ts). Then build out
[MenuSection.tsx](frontend/src/apps/tenant/restaurant/sections/MenuSection.tsx): category
list, item grid, create/edit dialog, availability toggle.

**Also this phase: the first tests.** The surface is still small, and one test matters more
than all the others — *tenant A cannot read tenant B's menu*. That is the bug you cannot
afford to ship, and it is trivial to write now.

**Exit:** create a category and an item in the browser, reload, confirm it persists in the
right schema and is invisible from the other tenant's subdomain — proven by a passing test,
not just by looking.

---

## Phase 3 — Orders and POS

**Goal:** the core of the product. Ring up a real order.

**Changes:**
- `Order`: add `branch`, `order_type` (dine_in / takeaway / delivery), `customer`, `server`
  (staff FK), the frozen money columns from D1 (`subtotal`, `tax_total`, `service_charge`,
  `discount_total`, `grand_total`), and status `draft -> placed -> preparing -> ready ->
  served -> paid` plus `cancelled` / `voided`.
- **Enforce legal transitions in one place on the model.** If a viewset can set arbitrary
  status, paid orders will reopen. Write `Order.transition_to(new_status)` that raises on an
  illegal move, and let the API call only that.
- `OrderItem` with D1 snapshots, plus an `OrderItemModifier` join for selected modifiers and
  per-line kitchen notes.
- Every state change writes an `AuditLog` row (Phase 1 exists for this).

**POS UI:** touch-first, large targets, minimal typing. Staff on a busy Friday night will not
read labels. Build single-order billing first; leave hooks for split/merge rather than
building them now.

**Exit:** ring up a dine-in order end to end, with correct totals, and confirm the totals do
not change when you edit the menu item's price afterwards. That last check is D1 working.

---

## Phase 4 — Tables, KOT and KDS

**Goal:** kitchen and front-of-house agree on order state within a second.

**Changes:**
- `Table`: add `branch` FK, and replace `unique=True` on `number` with
  `unique_together = ("branch", "number")` — table 5 exists in every branch.
- Status: available / occupied / reserved / cleaning. A grid is fine; drag-and-drop floor
  plan is a later nicety.
- **Channels + Redis (D5).** This is the phase that changes how you run the app: ASGI, a
  routing module, a per-branch consumer group, and `honcho`'s web line moves to an ASGI
  server. You already have `redis` and `django-redis` pinned. Check `D:\tms-websocket` for a
  pattern worth reusing.
- `Reservation`: add `status` (booked / seated / no_show / cancelled), time slots, waitlist.

**Exit:** place an order on the POS and watch it appear on a KDS screen in another browser
without a refresh; mark it ready there and watch the POS update.

---

## Phase 5 — Billing and payments

**Goal:** money leaves the building correctly and the paperwork survives an audit.

**Changes:**
- `Payment`: method, amount, reference, `paid_at`. One order has many payments — split
  payment, part cash part card, is the normal case, not the exception.
- `Invoice` with an immutable sequential number per branch. Allocate it inside a transaction
  with a row lock; **never** `count() + 1`. Tax authorities require gapless numbering and two
  concurrent cashiers will collide.
- Apply the Phase 1 `TaxRate` rows, including the compound service charge.
- Receipt: an HTML template that prints cleanly to 58mm/80mm thermal, plus a PDF.
- Gateways last, behind a `PaymentProvider` interface so the second one is easy. For Nepal:
  eSewa, Khalti, Fonepay.

> **Never store raw card data.** Use the gateway's hosted flow and you stay out of PCI-DSS
> scope entirely. Storing PANs pulls a compliance regime onto the whole stack.

**Exit:** close an order with a split payment and print a receipt with correct VAT and
service charge.

---

## Phase 6 — Reporting

Daily sales, sales by item and category, peak hours, staff performance.

Read from the frozen `Order` columns, never recompute from the live menu — that is the whole
point of D1. Start with plain aggregate queries; add materialized rollups only when a report
is measurably slow against real data.

**Exit:** a daily sales figure that matches hand-adding the day's invoices.

---

## Phase 7 — Inventory

The current `Inventory` model **cannot** do the auto-deduction the spec asks for, because
nothing connects a menu item to its ingredients. It needs a recipe join:

```python
class Ingredient(BaseModel):
    name, unit, current_stock, reorder_level, cost_per_unit

class RecipeLine(BaseModel):
    menu_item (FK), ingredient (FK), quantity_used

class StockMovement(BaseModel):
    ingredient (FK), delta, reason (sale/purchase/waste/correction),
    order (nullable FK), created_by
```

Deduct on order completion, in the same transaction, by **appending `StockMovement` rows
rather than mutating a counter**. Stock level then stays reconstructible and you get the
audit trail for free. Low-stock alerts and purchase orders follow from the same table.

**Exit:** complete an order and watch the right ingredient quantities drop, with a movement
row explaining each one.

---

## Phase 8 — CRM, loyalty, multi-branch rollout

Customer profiles and order history, loyalty points, coupons, feedback collection. Then turn
on the multi-branch UI that D2 already made possible: branch switcher, org-level versus
branch-level reporting. This is a UI phase, not a schema phase — which was the entire point
of deciding D2 in Phase 1.

---

## Cross-cutting, not a phase

- **Tests** start in Phase 2 and grow with each phase. Tenant isolation, order state
  transitions, and invoice numbering are the three that earn their keep.
- **`/api/docs/` is incomplete** — 15 drf-spectacular warnings from a missing
  `OpenApiAuthenticationExtension` for `TenantJWTAuthentication` and five APIViews with no
  `serializer_class`. Worth an hour before you invite anyone to integrate.
- **Platform-admin auth is a stopgap.** The `X-Platform-Token` shared secret closed an open
  hole; the real fix is a platform-admin user model in the public schema.
- **Unwired dependencies:** `celery`, `django-allauth`, `django-filter`,
  `django-cors-headers`, `boto3`, `django-storages` are pinned but unused. Celery becomes
  real in Phase 5 (receipts, notifications); drop the rest or use them.
- **No Docker, no CI.**

---

## Deliberately deferred

- **Offline POS.** Genuinely hard — local store, outbox queue, conflict resolution on
  reconnect. Do it once the online path is stable and you know the real failure modes.
- **Delivery aggregators** (Foodmandu, Pathao, Uber Eats). Each is bespoke; wait for a
  customer who needs one.
- **Accounting sync, hardware drivers, WhatsApp marketing.** Post-MVP.
- **Subscription billing for the SaaS itself.** `Tenant.plan` is a placeholder; wire metering
  when you have paying restaurants.
