"""Seed the curated festival/holiday list for a specific BS year.

Unlike seed_fixed_holidays (which only knows dates that recur every year),
this loads a hand-curated, year-specific list that includes lunar festivals
(Dashain, Tihar, Holi, ...) whose dates shift each year. Each year needs its
own fixture at fixtures/festivals/<year>.json, sourced from the official
Government of Nepal holiday list.

The 2083 fixture is compiled from the published 2083 B.S. public-holiday list.
Multi-day festival sub-day labels (e.g. individual Dashain / Tihar days) are
best-effort; the authoritative facts are the date ranges.

Usage:
    python manage.py seed_festivals --year 2083
    python manage.py seed_festivals --year 2083 --schema yums
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django_tenants.utils import get_tenant_model, schema_context

from apps.tenant.calendars.models import CalendarEvent

FIXTURE_DIR = Path(__file__).resolve().parents[2] / "fixtures" / "festivals"


class Command(BaseCommand):
    help = "Seed the curated festival list for a BS year into tenant schemas."

    def add_arguments(self, parser):
        parser.add_argument("--year", type=int, required=True, help="BS year to seed")
        parser.add_argument("--schema", type=str, default=None, help="Only this schema_name")

    def handle(self, *args, **opts):
        year = opts["year"]
        path = FIXTURE_DIR / f"{year}.json"
        if not path.exists():
            raise CommandError(f"No fixture for {year} BS (expected {path}).")
        rows = json.loads(path.read_text(encoding="utf-8"))

        TenantModel = get_tenant_model()
        tenants = TenantModel.objects.exclude(schema_name="public")
        if opts["schema"]:
            tenants = tenants.filter(schema_name=opts["schema"])
        if not tenants:
            self.stderr.write("No matching tenants found.")
            return

        for tenant in tenants:
            with schema_context(tenant.schema_name):
                # Replace any previously seeded rows for this year so re-runs are
                # clean and don't collide with seed_fixed_holidays. Tenant-created
                # events (source="tenant") are left untouched.
                deleted, _ = CalendarEvent.objects.filter(
                    bs_year=year, source="seed"
                ).delete()
                created = 0
                for r in rows:
                    CalendarEvent.objects.create(
                        bs_year=year,
                        bs_month=r["bs_month"],
                        bs_day=r["bs_day"],
                        title=r.get("title", ""),
                        title_np=r.get("title_np", ""),
                        category=r.get("category", "festival"),
                        is_holiday=r.get("is_holiday", False),
                        source="seed",
                    )
                    created += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"[{tenant.schema_name}] -{deleted} old, +{created} festivals for {year}"
                )
            )
