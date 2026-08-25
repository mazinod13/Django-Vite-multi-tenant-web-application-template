from django.contrib import admin

from .models import MenuCategory, MenuItem, MenuVariant, ModifierGroup, Modifier


# ---- Inlines ----

class MenuVariantInline(admin.TabularInline):
    model = MenuVariant
    extra = 1


class ModifierInline(admin.TabularInline):
    model = Modifier
    extra = 1


class ModifierGroupInline(admin.TabularInline):
    model = ModifierGroup
    extra = 1
    show_change_link = True  


class MenuItemInline(admin.TabularInline):
    model = MenuItem
    extra = 1
    show_change_link = True 


# ---- MENU admin panel ----

@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "is_active", "display_order")
    list_editable = ("is_active", "display_order")
    search_fields = ("name",)
    inlines = [MenuItemInline]


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("category", "name", "description", "display_order", "is_available")
    list_editable = ("display_order", "is_available")
    list_filter = ("category", "is_available")
    search_fields = ("name", "description")
    inlines = [MenuVariantInline, ModifierGroupInline]


@admin.register(MenuVariant)
class MenuVariantAdmin(admin.ModelAdmin):
    list_display = ("item", "name", "price", "is_default", "display_order")
    list_editable = ("price", "is_default", "display_order")
    list_filter = ("item__category",)
    search_fields = ("item__name", "name")


@admin.register(ModifierGroup)
class ModifierGroupAdmin(admin.ModelAdmin):
    list_display = ("item", "name", "is_required", "min_select", "max_select", "display_order")
    list_editable = ("is_required", "min_select", "max_select", "display_order")
    list_filter = ("item__category", "is_required")
    search_fields = ("item__name", "name")
    inlines = [ModifierInline]


@admin.register(Modifier)
class ModifierAdmin(admin.ModelAdmin):
    list_display = ("group", "name", "price_delta", "is_available", "display_order")
    list_editable = ("price_delta", "is_available", "display_order")
    list_filter = ("group__item__category",)
    search_fields = ("group__name", "name")