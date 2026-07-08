"""Seed Nepali holidays / festivals into each tenant schema.

Data source: https://github.com/the-value-crew/nepali-calendar-api
Per-month JSON at data/<bs_year>/<bs_month>.json, where each day is:
    {"n": <BS day, Devanagari>, "e": <AD day>, "t": <tithi>,
     "f": <festival/event name>, "h": <holiday bool>, "d": <weekday 1-7>}

Only days that are holidays (h == true) or carry a festival name (f != "")
are imported. The dataset covers roughly 1992-2080 BS; pass --start/--end
within that range.

Usage:
    python manage.py seed_holidays --start 2080 --end 2080
    python manage.py seed_holidays --start 2075 --end 2080 --schema demo
"""

import json
import urllib.error
import urllib.request

from django.core.management.base import BaseCommand
from django_tenants.utils import get_tenant_model, schema_context

from apps.tenant.calendars.models import CalendarEvent

BASE_URL = "https://raw.githubusercontent.com/the-value-crew/nepali-calendar-api/master/data"

# Devanagari -> ASCII digits so we can store bs_day as an int.
NP_TO_EN_DIGITS = {ord(np): en for np, en in zip("०१२३४५६७८९", "0123456789")}


def _to_int(devanagari: str):
    s = (devanagari or "").translate(NP_TO_EN_DIGITS).strip()
    return int(s) if s.isdigit() else None


def _fetch_month(bs_year: int, bs_month: int):
    url = f"{BASE_URL}/{bs_year}/{bs_month}.json"
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        raise


class Command(BaseCommand):
    help = "Seed Nepali holidays and festivals for a BS year range into tenant schemas."

    def add_arguments(self, parser):
        parser.add_argument("--start", type=int, required=True, help="Start BS year")
        parser.add_argument("--end", type=int, required=True, help="End BS year (inclusive)")
        parser.add_argument(
            "--schema",
            type=str,
            default=None,
            help="Only seed this tenant schema_name (default: every tenant)",
        )

    def handle(self, *args, **opts):
        start, end = opts["start"], opts["end"]
        TenantModel = get_tenant_model()

        tenants = TenantModel.objects.exclude(schema_name="public")
        if opts["schema"]:
            tenants = tenants.filter(schema_name=opts["schema"])
        if not tenants:
            self.stderr.write("No matching tenants found.")
            return

        # Fetch once, reuse across all tenant schemas.
        self.stdout.write(f"Fetching {start}-{end} BS from dataset...")
        rows = list(self._collect(start, end))
        self.stdout.write(f"Collected {len(rows)} holiday/festival rows.")

        for tenant in tenants:
            with schema_context(tenant.schema_name):
                created = self._write(rows)
            self.stdout.write(
                self.style.SUCCESS(f"[{tenant.schema_name}] +{created} new rows")
            )

    def _collect(self, start, end):
        for year in range(start, end + 1):
            for month in range(1, 13):
                data = _fetch_month(year, month)
                if not data:
                    continue
                for day in data.get("days", []):
                    bs_day = _to_int(day.get("n"))
                    festival = (day.get("f") or "").strip()
                    is_holiday = bool(day.get("h"))
                    if bs_day is None or (not festival and not is_holiday):
                        continue
                    yield {
                        "bs_year": year,
                        "bs_month": month,
                        "bs_day": bs_day,
                        "title_np": festival,
                        "tithi": (day.get("t") or "").strip(),
                        "is_holiday": is_holiday,
                        "category": "holiday" if is_holiday else "festival",
                    }

    def _write(self, rows):
        created = 0
        for r in rows:
            _, was_created = CalendarEvent.objects.get_or_create(
                bs_year=r["bs_year"],
                bs_month=r["bs_month"],
                bs_day=r["bs_day"],
                title_np=r["title_np"],
                source="seed",
                defaults={
                    "tithi": r["tithi"],
                    "is_holiday": r["is_holiday"],
                    "category": r["category"],
                },
            )
            created += int(was_created)
        return created
