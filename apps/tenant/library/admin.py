from django.contrib import admin
from .models import Book, BorrowRecord


class LibraryAdminMixin:
    def has_module_permission(self, request):
        tenant = getattr(request, "tenant", None)
        return bool(tenant and tenant.category == "library")


@admin.register(Book)
class BookAdmin(LibraryAdminMixin, admin.ModelAdmin):
    list_display = ("title", "author", "isbn", "total_copies", "available_copies")


@admin.register(BorrowRecord)
class BorrowRecordAdmin(LibraryAdminMixin, admin.ModelAdmin):
    list_display = ("book", "user", "borrowed_at", "due_date", "returned_at", "status")
