"""Seed the fixed-BS-date national holidays for a given BS year.

Unlike lunar festivals (Dashain, Tihar, ...), these holidays fall on the same
Bikram Sambat date every year, so they can be generated reliably for any year
including the current/future ones the community datasets don't cover.

Source list: apps/tenant/calendars/fixtures/fixed_holidays.json

Usage:
    python manage.py seed_fixed_holidays --year 2083
    python manage.py seed_fixed_holidays --year 2083 --schema yums
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django_tenants.utils import get_tenant_model, schema_context

from apps.tenant.calendars.models import CalendarEvent

FIXTURE = Path(__file__).resolve().parents[2] / "fixtures" / "fixed_holidays.json"


class Command(BaseCommand):
    help = "Seed fixed-date national holidays for a BS year into tenant schemas."

    def add_arguments(self, parser):
        parser.add_argument("--year", type=int, required=True, help="BS year to generate")
        parser.add_argument("--schema", type=str, default=None, help="Only this schema_name")

    def handle(self, *args, **opts):
        year = opts["year"]
        rows = json.loads(FIXTURE.read_text(encoding="utf-8"))

        TenantModel = get_tenant_model()
        tenants = TenantModel.objects.exclude(schema_name="public")
        if opts["schema"]:
            tenants = tenants.filter(schema_name=opts["schema"])
        if not tenants:
            self.stderr.write("No matching tenants found.")
            return

        for tenant in tenants:
            with schema_context(tenant.schema_name):
                created = 0
                for r in rows:
                    _, was_created = CalendarEvent.objects.get_or_create(
                        bs_year=year,
                        bs_month=r["bs_month"],
                        bs_day=r["bs_day"],
                        title_np=r["title_np"],
                        source="seed",
                        defaults={
                            "title": r["title"],
                            "category": r["category"],
                            "is_holiday": r["is_holiday"],
                        },
                    )
                    created += int(was_created)
            self.stdout.write(
                self.style.SUCCESS(f"[{tenant.schema_name}] +{created} fixed holidays for {year}")
            )
