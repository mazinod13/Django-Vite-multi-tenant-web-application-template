from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Role, TenantUser


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {}


@admin.register(TenantUser)
class TenantUserAdmin(UserAdmin):
    """UserAdmin gives the nice password/permissions form; this adds our fields."""

    list_display = ("username", "email", "role", "branch", "is_active", "is_staff")
    list_filter = UserAdmin.list_filter + ("role", "branch")
    fieldsets = UserAdmin.fieldsets + (
        ("Restaurant", {"fields": ("role", "branch", "phone", "avatar", "profile_data")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Restaurant", {"fields": ("role", "branch", "phone")}),
    )
