from django.db import models

from apps.tenant.core.models import BaseModel


class CalendarEvent(BaseModel):
    """A single dated entry on the Bikram Sambat calendar.

    Covers national holidays / festivals (seeded) and tenant-specific
    events (added through the API/admin). Dates are stored in BS; the AD
    date is optional because the frontend can derive it from BS, but tenant
    events entered in AD can store it directly.
    """

    CATEGORY_CHOICES = [
        ("holiday", "Public Holiday"),
        ("festival", "Festival"),
        ("event", "Event"),
    ]
    SOURCE_CHOICES = [
        ("seed", "Seeded dataset"),
        ("tenant", "Tenant-created"),
    ]

    bs_year = models.PositiveIntegerField()
    bs_month = models.PositiveSmallIntegerField(help_text="1 = Baisakh ... 12 = Chaitra")
    bs_day = models.PositiveSmallIntegerField()
    ad_date = models.DateField(null=True, blank=True)

    title = models.CharField(max_length=200, blank=True, help_text="Romanized / English name")
    title_np = models.CharField(max_length=200, blank=True, help_text="Nepali (Devanagari) name")
    tithi = models.CharField(max_length=100, blank=True)

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="event")
    is_holiday = models.BooleanField(default=False)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="tenant")

    class Meta:
        ordering = ["bs_year", "bs_month", "bs_day"]
        indexes = [models.Index(fields=["bs_year", "bs_month"])]
        constraints = [
            models.UniqueConstraint(
                fields=["bs_year", "bs_month", "bs_day", "title_np", "source"],
                name="uniq_calendar_event_per_day",
            )
        ]

    def __str__(self):
        return f"{self.bs_year}-{self.bs_month:02d}-{self.bs_day:02d} {self.title or self.title_np}"
