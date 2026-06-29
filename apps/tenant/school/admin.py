from django.contrib import admin

from .models import ClassRoom, Student, Attendance


class SchoolAdminMixin:
    """Only show these models in the admin for school tenants."""
    def has_module_permission(self, request):
        tenant = getattr(request, "tenant", None)
        return bool(tenant and tenant.category == "school")


@admin.register(ClassRoom)
class ClassRoomAdmin(SchoolAdminMixin, admin.ModelAdmin):
    list_display = ("name", "teacher", "capacity")


@admin.register(Student)
class StudentAdmin(SchoolAdminMixin, admin.ModelAdmin):
    list_display = ("full_name", "roll_no", "classroom")


@admin.register(Attendance)
class AttendanceAdmin(SchoolAdminMixin, admin.ModelAdmin):
    list_display = ("student", "date", "present")
