from collections import defaultdict

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import CalendarEvent
from .serializers import CalendarEventSerializer


class CalendarEventViewSet(ModelViewSet):
    """CRUD for tenant calendar events.

    django-tenants already scopes queries to the current schema. Supports
    filtering by ?bs_year=&bs_month= for convenience.
    """

    serializer_class = CalendarEventSerializer
    permission_classes = [IsAuthenticated]
    queryset = CalendarEvent.objects.filter(is_deleted=False)

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if (year := params.get("bs_year")):
            qs = qs.filter(bs_year=year)
        if (month := params.get("bs_month")):
            qs = qs.filter(bs_month=month)
        return qs

    def perform_destroy(self, instance):
        # soft delete to match the rest of the tenant models
        instance.sof_delete()


class CalendarYearView(APIView):
    """Read-only: every event for a BS year, grouped by month.

    GET /api/calendar/<bs_year>/
    -> { "year": 2083, "months": { "1": [ {...day...} ], "3": [ ... ] } }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, bs_year: int):
        events = (
            CalendarEvent.objects
            .filter(is_deleted=False, bs_year=bs_year)
            .order_by("bs_month", "bs_day")
        )
        months = defaultdict(list)
        for e in events:
            months[str(e.bs_month)].append(CalendarEventSerializer(e).data)
        return Response({"year": int(bs_year), "months": months})
