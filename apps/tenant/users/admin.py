from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Role, TenantUser

admin.site.register(Role)
admin.site.register(TenantUser, UserAdmin)   # UserAdmin gives the nice user form
