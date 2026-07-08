from rest_framework import serializers

from .models import CalendarEvent


class CalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = [
            "id",
            "bs_year",
            "bs_month",
            "bs_day",
            "ad_date",
            "title",
            "title_np",
            "tithi",
            "category",
            "is_holiday",
            "source",
        ]
        read_only_fields = ["source"]

    def create(self, validated_data):
        # anything created through the API is a tenant event
        validated_data["source"] = "tenant"
        return super().create(validated_data)
