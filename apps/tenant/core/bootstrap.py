"""Seed a newly created tenant schema so the restaurant is usable immediately.

Everything here MUST run inside the new schema. Callers in the public schema
wrap it in django_tenants' schema_context(); see apps/public/tenants/views.py.
"""

from decimal import Decimal

from .models import Branch, TaxRate, TenantSettings

MAIN_BRANCH_NAME = "Main"

# Nepal defaults. VAT applies to the whole order, so it is charged on the
# subtotal *plus* the service charge -- which is why applies_to is ORDER
# rather than ITEM. Change per market in the admin, not in code.
DEFAULT_TAX_RATES = [
    {"name": "VAT", "percent": Decimal("13.00"), "applies_to": TaxRate.ORDER},
]


def seed_roles():
    """Create the fixed staff roles. Idempotent."""
    from apps.tenant.users.models import Role

    created = []
    for slug in Role.DEFAULT_ORDER:
        role, was_created = Role.objects.get_or_create(
            slug=slug, defaults={"name": dict(Role.SLUG_CHOICES)[slug]},
        )
        if was_created:
            created.append(role)
    return created


def bootstrap_tenant(tenant=None):
    """Idempotent: safe to re-run against an existing schema to backfill."""
    branch, _ = Branch.objects.get_or_create(
        name=MAIN_BRANCH_NAME,
        defaults={"phone": "", "address": ""},
    )
    settings_row = TenantSettings.load()
    for rate in DEFAULT_TAX_RATES:
        TaxRate.objects.get_or_create(name=rate["name"], defaults=rate)
    roles = seed_roles()
    return {"branch": branch, "settings": settings_row, "roles_created": len(roles)}
