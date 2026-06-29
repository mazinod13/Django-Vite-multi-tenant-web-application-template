from django.contrib import admin

from .models import Table,MenuItem,Order,OrderItem,Reservation,Inventory

class RestaurantAdminMixin:
    def has_module_permission(self,request):
        tenant = getattr(request, "tenant",None)
        return bool(tenant and tenant.category == "restaurant")
    
@admin.register(Table)    
class TableAdmin(RestaurantAdminMixin,admin.ModelAdmin):
    list_display = ("number","seats","is_occupied")
    
@admin.register(MenuItem)
class MenuItemAdmin(RestaurantAdminMixin,admin.ModelAdmin):
    list_display = ("name","description","price","is_available")

@admin.register(Order)
class OrderAdmin(RestaurantAdminMixin,admin.ModelAdmin):
    list_display = ("table","status","note","total")

@admin.register(OrderItem)                
class OrderItemAdmin(RestaurantAdminMixin,admin.ModelAdmin):
    list_display = ("order","menu_item","quantity")
    
@admin.register(Reservation)
class ReservationAdmin(RestaurantAdminMixin,admin.ModelAdmin):
    list_display = ("customer_name","phone","table","reserved_for","party_size")
    
@admin.register(Inventory)
class InventoryAdmin(RestaurantAdminMixin,admin.ModelAdmin):
    list_display = ("item_name","quantity","unit","reorder_level")
                   