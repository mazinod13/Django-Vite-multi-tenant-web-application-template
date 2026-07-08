from django.contrib import admin

from .models import CalendarEvent


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ("bs_year", "bs_month", "bs_day", "title_np", "title", "category", "is_holiday", "source")
    list_filter = ("category", "is_holiday", "source", "bs_year", "bs_month")
    search_fields = ("title", "title_np", "tithi")
    ordering = ("bs_year", "bs_month", "bs_day")
