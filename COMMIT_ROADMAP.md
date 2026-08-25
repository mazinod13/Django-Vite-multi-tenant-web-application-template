# Commit Roadmap

A commit-by-commit plan for building the restaurant SaaS. The phases and the reasoning
behind them live in [ROADMAP.md](ROADMAP.md); this file is the working checklist.

Tick a box when the commit is on the branch and its check passes.

---

## Conventions

**Message format** — matches the existing history:

```
<type>(<scope>): <imperative summary, lowercase, no trailing period>

<why, wrapped at ~72 cols. What the diff does is visible in the diff;
why it does it is not.>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
Scopes used here: `core`, `restaurant`, `api`, `billing`, `inventory`, `crm`, `kds`,
`frontend`, `reports`.

**Before every commit:**

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run   # must say "No changes detected"
cd frontend; npx tsc --noEmit; npm run build; cd ..
python manage.py test                                # once C2.4 exists
```

**Rules that will save you a bad afternoon:**

- One logical change per commit. If the message needs the word "and", it is two commits.
- Never commit a model change without its migration in the same commit. A commit that
  leaves `makemigrations --check` dirty is broken for everyone who checks it out.
- Restart the server after a model change. The autoreloader handles it now that
  `--noreload` is gone from the Procfile, but a migration applied under a running server
  still leaves in-flight requests on old code. For anything beyond a trivial column add:
  stop, migrate, start.
- Any code touching tenant models from the public schema must be inside
  `with schema_context(...)`. This is the most common source of "why is the new
  restaurant empty".

---

## Phase 2 — Menu

The first full vertical slice. Build it carefully; every later module copies its shape.

- [ ] **C2.1 — `feat(restaurant): reshape menu into categories, variants and modifiers`**

  Replace the flat `MenuItem` with `MenuCategory`, `MenuItem`, `MenuVariant`,
  `ModifierGroup`, `Modifier`. Register all of them in `admin.py` in the same commit —
  that is how you seed test data before any UI exists.

  **This is the one-time migration squash.** Restaurant tables are empty in every schema,
  so do not write a forward reshape:

  ```sql
  -- once per tenant schema (sunrise, yums)
  DROP TABLE IF EXISTS sunrise.restaurant_orderitem, sunrise.restaurant_order,
    sunrise.restaurant_reservation, sunrise.restaurant_table,
    sunrise.restaurant_menuitem, sunrise.restaurant_inventory CASCADE;
  DELETE FROM sunrise.django_migrations WHERE app = 'restaurant';
  ```

  ```powershell
  Remove-Item apps\tenant\restaurant\migrations\0001_initial.py
  python manage.py makemigrations restaurant
  python manage.py migrate_schemas
  ```

  > After this commit the shortcut is gone. Every later model change is a forward
  > migration, forever. Write the date here when you take it: ____________

  **Check:** create a category and an item in `/admin/` on a tenant subdomain.

- [ ] **C2.2 — `feat(api): menu serializers and viewsets`**

  `apps/tenant/restaurant/serializers.py` and `views.py`. Nest variants and modifier
  groups inside the item serializer so the POS fetches a whole menu in one request.
  Inherit `TenantBaseViewSet` from [apps/tenant/api/views.py](apps/tenant/api/views.py) —
  you get soft-delete filtering and `IsAuthenticated` free.

  **Check:** the endpoints show up at `/api/docs/`.

- [ ] **C2.3 — `feat(api): mount restaurant routes at /api/restaurant/`**

  New `apps/tenant/restaurant/urls.py`, included from [config/urls.py](config/urls.py).

  **Check:** `GET /api/restaurant/menu-items/` returns your seeded item with a Bearer
  token, and 401s without one.

- [ ] **C2.4 — `test(restaurant): tenant isolation for the menu api`**

  The first tests in the repo. The one that matters: **a token issued for tenant A cannot
  read tenant B's menu.** Also cover soft-deleted items staying hidden, and unauthenticated
  access being refused.

  **Check:** `python manage.py test` green — then temporarily break the isolation and
  confirm the test actually fails. A test you have never seen fail is not yet a test.

- [ ] **C2.5 — `feat(frontend): typed api client`**

  `frontend/src/lib/api.ts` — thin typed wrappers over the existing `authFetch` in
  [frontend/src/lib/auth.ts](frontend/src/lib/auth.ts), with types mirroring the
  serializers.

  **Check:** `npx tsc --noEmit` clean.

- [ ] **C2.6 — `feat(frontend): menu management ui`**

  Build out [MenuSection.tsx](frontend/src/apps/tenant/restaurant/sections/MenuSection.tsx):
  category list, item grid, create/edit dialog, and an availability toggle for 86-ing an
  item.

  **Check:** create an item in the browser, reload, it persists — and is invisible from the
  other tenant's subdomain.

---

## Phase 3 — Orders and POS

- [ ] **C3.1 — `feat(restaurant): order models with frozen line prices`**

  `Order` with `branch`, `order_type` (dine_in/takeaway/delivery), `customer`, `server`,
  and the money columns (`subtotal`, `tax_total`, `service_charge`, `discount_total`,
  `grand_total`). `OrderItem` with `unit_price` and `name_snapshot` captured at order time,
  plus `OrderItemModifier`.

  **Check:** change a menu price after saving an order; the order total must not move.

- [ ] **C3.2 — `feat(restaurant): enforce order status transitions on the model`**

  `Order.transition_to(status)` raising on an illegal move. The API calls only this, never
  `order.status = x`. Write an `AuditLog` row on every transition.

  **Check:** a paid order cannot go back to draft.

- [ ] **C3.3 — `feat(api): order endpoints`**

- [ ] **C3.4 — `test(restaurant): order totals and illegal transitions`**

- [ ] **C3.5 — `feat(frontend): pos order entry`**

  Touch-first, large targets, minimal typing. Single-order billing only — leave hooks for
  split and merge rather than building them now.

  **Check:** ring up a dine-in order end to end with correct totals.

---

## Phase 4 — Tables, KOT and KDS

- [ ] **C4.1 — `feat(restaurant): branch-scoped tables`**

  Add the `branch` FK; replace `unique=True` on `number` with
  `unique_together = ("branch", "number")`. Status: available / occupied / reserved /
  cleaning.

- [ ] **C4.2 — `chore: serve over asgi with channels and redis`**

  Infrastructure only, no features. It changes how you run the app, so keep it isolated —
  if it breaks something you want a clean revert.

  **Check:** every existing page still serves under ASGI.

- [ ] **C4.3 — `feat(kds): broadcast order events per branch`**

- [ ] **C4.4 — `feat(frontend): kitchen display screen`**

  **Check:** place an order on the POS and watch it appear on a KDS screen in another
  browser with no refresh; mark it ready there and watch the POS update.

- [ ] **C4.5 — `feat(restaurant): reservations with status and waitlist`**

---

## Phase 5 — Billing and payments

- [ ] **C5.1 — `feat(billing): payment model`**

  Many payments per order — split payment is the normal case, not the exception.

- [ ] **C5.2 — `feat(billing): gapless per-branch invoice numbering`**

  Allocate inside a transaction with a row lock. **Never `count() + 1`** — two cashiers
  will collide, and gapless numbering is a legal requirement.

- [ ] **C5.3 — `feat(billing): apply tax rates and service charge`**

  Use the `TaxRate` rows seeded in Phase 1. VAT is `applies_to=order`, so it is charged on
  subtotal *plus* service charge.

- [ ] **C5.4 — `test(billing): concurrent invoice numbering has no gaps or duplicates`**

  Hit the allocator from parallel threads and assert the sequence is contiguous. This is
  the test that justifies C5.2's complexity.

- [ ] **C5.5 — `feat(billing): thermal receipt template`** — 58mm/80mm, plus PDF.

- [ ] **C5.6 — `feat(billing): payment provider interface`**

  Abstract first, then one provider (eSewa or Khalti). **Never store raw card data** — use
  the gateway's hosted flow and stay out of PCI-DSS scope entirely.

---

## Phase 6 — Reporting

- [ ] **C6.1 — `feat(reports): sales aggregates`**

  Daily/weekly/monthly, by item, by category, peak hours. Read the frozen `Order` columns,
  never the live menu.

- [ ] **C6.2 — `feat(frontend): reports section`**

  **Check:** the daily sales figure matches hand-adding the day's invoices.

---

## Phase 7 — Inventory

- [ ] **C7.1 — `feat(inventory): ingredients and recipe lines`**

  The current `Inventory` model cannot auto-deduct, because nothing links a menu item to
  its ingredients. Add `Ingredient`, `RecipeLine`, `StockMovement`.

- [ ] **C7.2 — `feat(inventory): deduct stock on order completion`**

  Append `StockMovement` rows in the same transaction. **Never mutate a counter** — stock
  stays reconstructible and the audit trail comes free.

- [ ] **C7.3 — `feat(inventory): low stock alerts and purchase orders`**

- [ ] **C7.4 — `feat(frontend): inventory section`**

---

## Phase 8 — CRM, loyalty, multi-branch

- [ ] **C8.1 — `feat(crm): customer profiles and order history`**
- [ ] **C8.2 — `feat(crm): loyalty points and coupons`**
- [ ] **C8.3 — `feat(frontend): branch switcher and org-level reporting`**

  Pure UI, because Phase 1 already put `branch` on everything.

---

## Debt to clear between phases

Not blocking, but do not let these rot:

- [ ] **`fix(api): silence drf-spectacular warnings`** — an
      `OpenApiAuthenticationExtension` for `TenantJWTAuthentication`, and a
      `serializer_class` on the five bare APIViews. 15 warnings today, and `/api/docs/` is
      incomplete until this lands.
- [ ] **`refactor(tenants): real platform-admin auth`** — the `X-Platform-Token` shared
      secret closed an open hole but is a stopgap. The proper fix is a platform-admin user
      model in the public schema.
- [ ] **`chore: drop or wire unused dependencies`** — `django-allauth`, `django-filter`,
      `django-cors-headers`, `boto3`, `django-storages` are pinned but unused. `celery`
      becomes real in Phase 5 (receipts, notifications).
- [ ] **`chore: add docker compose and ci`**
