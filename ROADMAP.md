# Restaurant SaaS — Build Roadmap

Branch: `saas-restaurant-v1.0`. One tenant = one restaurant business, isolated in its
own PostgreSQL schema via django-tenants.

---

## Where you are now

**Working:** multi-tenancy (schema per restaurant), tenant-aware JWT auth
(login/register/logout/refresh/password reset), a sidebar dashboard shell with
react-router, the platform-admin SPA on the bare domain, and a Bikram Sambat
`CalendarEvent` model + API you'll use later for holiday pricing rules.

**Models that exist but have no API and no UI:** `Table`, `MenuItem`, `Order`,
`OrderItem`, `Reservation`, `Inventory` in [apps/tenant/restaurant/models.py](apps/tenant/restaurant/models.py).
The five React sections are "coming soon" stubs.

**So the real job:** turn those six placeholder models into the data model the spec
needs, then build outward module by module.

---

## Step 0 — Finish the purge in the database

Deleting the `school` app removed the code, but the tables are still sitting in every
existing tenant schema (`sunrise`, `yums`), along with stale `django_migrations` rows.

```powershell
$env:PGPASSWORD='root'
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -d saas_template
```

Then, once per tenant schema:

```sql
DROP TABLE IF EXISTS sunrise.school_attendance, sunrise.school_student, sunrise.school_classroom CASCADE;
DELETE FROM sunrise.django_migrations WHERE app = 'school';

DROP TABLE IF EXISTS yums.school_attendance, yums.school_student, yums.school_classroom CASCADE;
DELETE FROM yums.django_migrations WHERE app = 'school';
```

Verify nothing is left:

```sql
SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE 'school_%';
```

Also drop `sunrise` entirely if it was only ever a school demo — `DROP SCHEMA sunrise CASCADE;`
then delete its `Tenant` and `Domain` rows from the public schema.

---

## Step 1 — Lock these five decisions before writing any module

Each one is cheap now and expensive after you have live data in tenant schemas,
because every change means a migration replayed across every restaurant's schema.

### 1.1 Snapshot prices on the order line — do not derive them

Today `OrderItem.subtotal` reads `self.menu_item.price` live. That means raising the
price of a pizza silently rewrites every historical order and every past receipt total.
For a POS this is a correctness bug, not a nitpick — it breaks reconciliation and tax
records.

```python
class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    name_snapshot = models.CharField(max_length=100)          # menu item may be renamed later
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # frozen at order time
    quantity = models.PositiveIntegerField(default=1)

    @property
    def subtotal(self):
        return self.unit_price * self.quantity
```

Same rule for the order as a whole: store `subtotal`, `tax_total`, `service_charge`,
`discount_total`, `grand_total` as columns on `Order`, computed once when the order is
finalized. Never recompute a closed order from current menu prices.

### 1.2 Decide multi-branch NOW, even if the MVP has one branch

The spec wants franchise support. With schema-per-tenant, a tenant is the *business*
and branches are rows inside it. That means `Branch` is a foreign key on `Table`,
`Order`, `Inventory`, `StaffProfile`, and menu availability. Adding that FK to six
populated tables later is a painful migration across every tenant schema.

Recommendation: create `Branch` in Step 2, auto-create a "Main" branch on tenant
signup, and hang everything off it from day one. Multi-branch then becomes a UI
feature, not a schema migration.

```python
class Branch(BaseModel):
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    timezone = models.CharField(max_length=50, default="Asia/Kathmandu")
    is_active = models.BooleanField(default=True)
```

### 1.3 Money and tax representation

- Keep `DecimalField`, never float. Widen to `max_digits=10, decimal_places=2`.
- Currency belongs on the tenant/branch, not on each item.
- Nepal VAT is 13% plus a 10% service charge, and the service charge is normally taxed
  too. Model tax as a `TaxRate` table (name, percent, is_compound, applies_to) rather
  than a hardcoded constant, or you will rewrite billing when you hit a second market.

### 1.4 RBAC — make the existing `Role` model actually do something

`Role.permissions` is an unused M2M to `auth.Permission`. The spec needs owner /
manager / waiter / chef / cashier. Decide now:

- **Simple (recommended for MVP):** add `Role.slug` with fixed choices and write DRF
  permission classes that check `request.user.role.slug`. Predictable, easy to reason
  about, easy to test.
- **Flexible:** keep the Django `Permission` M2M and let owners build custom roles.
  More power, considerably more UI and more ways to lock yourself out.

Whichever you pick, seed the default roles when a tenant is created so a fresh
restaurant is usable immediately.

### 1.5 Real-time transport for KDS

The kitchen display and the POS must agree on order state within a second or two.
Django Channels + Redis is the fit here, and you already have Redis and `django-redis`
pinned. This changes your run command (ASGI, not WSGI), so decide before you build the
orders module rather than retrofitting.

Note you have a `D:\tms-websocket` working directory — if that has a Channels setup you
like, reuse the pattern.

---

## Step 2 — Foundation (before any feature module)

1. Create `Branch` and a `TenantSettings` singleton (currency, tax rates, service
   charge, opening hours).
2. Add `Role.slug` + seed default roles; add `StaffProfile` linking `TenantUser` to a
   `Branch`.
3. Add an `AuditLog` model now, not later — the spec explicitly wants "who voided this
   order, who changed this price". Retrofitting audit trails means losing all history
   before the retrofit.
   ```python
   class AuditLog(BaseModel):
       actor = models.ForeignKey(TenantUser, on_delete=models.SET_NULL, null=True)
       action = models.CharField(max_length=50)        # created | updated | voided | refunded
       model_name = models.CharField(max_length=50)
       object_id = models.UUIDField()
       changes = models.JSONField(default=dict)
       ip_address = models.GenericIPAddressField(null=True, blank=True)
   ```
4. Hook tenant creation to auto-provision: Main branch, default roles, an owner user.
   Right now `TenantSerializer.create` only makes the schema and domain.

**Checkpoint:** `python manage.py makemigrations restaurant users` then
`python manage.py migrate_schemas`, and confirm a newly created tenant comes up usable.

---

## Step 3 — Module 1: Menu (your first vertical slice)

This is the smallest module that exercises the whole stack, so build it end to end and
use it as the template for every module after it.

**Models** — replace the current flat `MenuItem`:

```python
class MenuCategory(BaseModel):       # Starters, Mains, Drinks
    name, sort_order, is_active

class MenuItem(BaseModel):
    category (FK), name, description, image, base_price,
    is_available (the "86'd" toggle), sort_order

class MenuVariant(BaseModel):        # Small / Medium / Large
    menu_item (FK), name, price_delta

class ModifierGroup(BaseModel):      # "Choose a sauce", min/max selectable
    name, min_select, max_select, is_required

class Modifier(BaseModel):           # Extra cheese +50
    group (FK), name, price_delta
```

**Backend steps:**
1. Write the models, `makemigrations restaurant`, `migrate_schemas`.
2. Serializers in `apps/tenant/restaurant/serializers.py` — nest variants and modifier
   groups inside the item so the POS fetches a menu in one request.
3. ViewSets inheriting `TenantBaseViewSet` from [apps/tenant/api/views.py](apps/tenant/api/views.py)
   (you already get soft-delete filtering and `IsAuthenticated` free).
4. New `apps/tenant/restaurant/urls.py`, included at `/api/restaurant/` in
   [config/urls.py](config/urls.py).
5. Register everything in `admin.py` so you can seed data without a UI.

**Frontend steps:**
6. `frontend/src/lib/api.ts` — thin typed wrappers over the existing `authFetch`
   in [frontend/src/lib/auth.ts](frontend/src/lib/auth.ts).
7. Build out [MenuSection.tsx](frontend/src/apps/tenant/restaurant/sections/MenuSection.tsx):
   category list, item grid, create/edit dialog, availability toggle.

**Checkpoint:** create a category and an item in the browser, reload, confirm it
persists in the right schema and is invisible from another tenant's subdomain.

---

## Step 4 — Module 2: Orders + POS

Depends on Step 3. The core of the product.

- `Order`: add `branch`, `order_type` (dine_in / takeaway / delivery), `customer`,
  `server` (staff FK), the frozen money columns from 1.1, and a status machine
  `draft -> placed -> preparing -> ready -> served -> paid`, plus `cancelled`/`voided`.
- Enforce legal transitions in one place on the model. Do not let a viewset set
  arbitrary status — that is how you get paid orders reopening.
- `OrderItem` with the price snapshot, plus selected modifiers and per-line notes.
- POS UI: touch-first, big targets, minimal typing. Staff on a busy Friday will not
  read labels.
- Split bill and merge tables are the fiddly parts. Build single-order billing first
  and leave hooks for splitting.

**Checkpoint:** ring up a dine-in order end to end and see correct totals.

---

## Step 5 — Module 3: Tables + KOT/KDS

- `Table`: add `branch` FK, and drop `unique=True` on `number` in favour of
  `unique_together = ("branch", "number")` — table 5 exists in every branch.
- Status: available / occupied / reserved / cleaning. Floor plan can start as a simple
  grid; drag-and-drop layout is a later nicety.
- Kitchen Display: Django Channels consumer broadcasting order events to a
  per-branch group. Kitchen marks items ready, POS sees it live.
- `Reservation`: add `status` (booked / seated / no_show / cancelled), time slots, and
  a waitlist.

---

## Step 6 — Module 4: Billing + payments

- `Payment` model: method, amount, reference, `paid_at`. One order can have many
  payments (split payment, part cash part card).
- `Invoice` with an immutable sequential number per branch — tax authorities require
  gapless numbering, so allocate it in a transaction, never from `count() + 1`.
- Receipt: HTML template that prints cleanly to 58mm/80mm thermal, plus a PDF.
- Gateway integration last, behind an interface. For Nepal: eSewa, Khalti, Fonepay.
  Keep the provider behind a `PaymentProvider` abstraction so the second one is easy.
- **Never store raw card data.** Use the gateway's hosted flow and you stay out of
  PCI-DSS scope entirely.

---

## Step 7 — Module 5: Basic reporting

Daily sales, sales by item, sales by category, peak hours, staff performance.

Read from the frozen order columns, never recompute from the live menu. Start with
straightforward aggregate queries; add materialized rollups only when a report gets
slow with real data.

---

## Step 8 — Module 6: Inventory

The current `Inventory` model cannot support the spec's auto-deduction, because nothing
connects a menu item to its ingredients. You need a recipe join:

```python
class Ingredient(BaseModel):
    name, unit, current_stock, reorder_level, cost_per_unit

class RecipeLine(BaseModel):
    menu_item (FK), ingredient (FK), quantity_used

class StockMovement(BaseModel):
    ingredient (FK), delta, reason (sale/purchase/waste/correction),
    order (nullable FK), created_by
```

Deduct on order completion, inside the same transaction, by writing `StockMovement`
rows rather than mutating a counter. Then stock level is always reconstructible and you
get a full audit trail for free. Low-stock alerts and purchase orders follow.

---

## Step 9 — Module 7: CRM, loyalty, multi-branch rollout

Customer profiles and order history, loyalty points, coupons, feedback. Then turn on
the multi-branch UI that Step 1.2 already made possible: branch switcher, org-level vs
branch-level reporting.

---

## Deliberately deferred

- **Offline POS.** Genuinely hard: needs a local store, an outbox queue, and conflict
  resolution on reconnect. Do it once the online path is stable and you understand the
  real failure modes.
- **Delivery aggregators** (Foodmandu, Pathao). Each is a bespoke integration; wait for
  a customer who actually needs one.
- **Accounting sync, hardware drivers, WhatsApp marketing.** All post-MVP.
- **Subscription billing for the SaaS itself.** `Tenant.plan` exists as a placeholder;
  wire it to real metering when you have paying restaurants.

---

## Known debt carried into this branch

- Zero tests anywhere. Worth fixing at Step 3, while the surface is still small — a
  tenant-isolation test in particular ("tenant A cannot read tenant B's menu") is the
  one bug you cannot afford to ship.
- `/api/docs/` is incomplete: 15 drf-spectacular warnings from a missing
  `OpenApiAuthenticationExtension` for `TenantJWTAuthentication` and five APIViews with
  no `serializer_class`.
- The platform-admin API is gated by a shared token, which is a stopgap. Real fix is a
  proper platform-admin user model in the public schema.
- `celery`, `django-allauth`, `django-filter`, `django-cors-headers`, `boto3`, and
  `django-storages` are pinned but unwired. Either use them or drop them.
- No Docker setup and no CI.
