from django.contrib import admin

from .models import Table,MenuItem,Order,OrderItem,Reservation,Inventory

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ("number","seats","is_occupied")
    
@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("name","description","price","is_available")

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("table","status","note","total")

@admin.register(OrderItem)                
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order","menu_item","quantity")
    
@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("customer_name","phone","table","reserved_for","party_size")
    
@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ("item_name","quantity","unit","reorder_level")
                   