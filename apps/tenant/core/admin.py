from django.contrib import admin

from .models import AuditLog, Branch, TaxRate, TenantSettings


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "timezone", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "address")


@admin.register(TenantSettings)
class TenantSettingsAdmin(admin.ModelAdmin):
    list_display = ("currency", "service_charge_percent", "invoice_prefix")

    def has_add_permission(self, request):
        # Singleton: one settings row per schema.
        return not TenantSettings.objects.exists()


@admin.register(TaxRate)
class TaxRateAdmin(admin.ModelAdmin):
    list_display = ("name", "percent", "applies_to", "is_compound", "is_active")
    list_filter = ("applies_to", "is_active", "is_compound")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "model_name", "object_id")
    list_filter = ("action", "model_name")
    search_fields = ("object_id", "model_name")
    date_hierarchy = "created_at"

    # Append-only: the trail is worthless if it can be edited after the fact.
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
