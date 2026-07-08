from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CalendarEventViewSet, CalendarYearView

router = DefaultRouter()
router.register("events", CalendarEventViewSet, basename="calendar-event")

urlpatterns = [
    path("<int:bs_year>/", CalendarYearView.as_view(), name="calendar-year"),
    *router.urls,
]
