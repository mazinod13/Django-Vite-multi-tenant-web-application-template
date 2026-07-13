from django.db import models
from apps.tenant.core.models import BaseModel
from apps.tenant.users.models import TenantUser


class Book(BaseModel):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=20, unique=True)
    total_copies = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.title} by {self.author}"


class BorrowRecord(BaseModel):
    STATUS_CHOICES = [
        ("borrowed", "Borrowed"),
        ("returned", "Returned"),
        ("overdue", "Overdue"),
    ]
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="borrows")
    user = models.ForeignKey(TenantUser, on_delete=models.CASCADE, related_name="borrows")
    borrowed_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField()
    returned_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="borrowed")

    def __str__(self):
        return f"{self.user.username} borrowed {self.book.title}"
