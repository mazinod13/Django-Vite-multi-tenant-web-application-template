from django.contrib import admin
from .models import Supplier, Product, StockTransaction


class InventoryAdminMixin:
    def has_module_permission(self, request):
        tenant = getattr(request, "tenant", None)
        return bool(tenant and tenant.category == "inventory")


@admin.register(Supplier)
class SupplierAdmin(InventoryAdminMixin, admin.ModelAdmin):
    list_display = ("name", "contact_name", "email", "phone")


@admin.register(Product)
class ProductAdmin(InventoryAdminMixin, admin.ModelAdmin):
    list_display = ("name", "sku", "category", "unit_price", "quantity_on_hand", "reorder_level", "supplier")


@admin.register(StockTransaction)
class StockTransactionAdmin(InventoryAdminMixin, admin.ModelAdmin):
    list_display = ("product", "transaction_type", "quantity", "transaction_date", "performed_by", "reference")
