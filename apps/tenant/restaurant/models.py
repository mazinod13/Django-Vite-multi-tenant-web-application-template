from django.db import models

from apps.tenant.core.models import BaseModel


class Table(BaseModel):
    number = models.PositiveIntegerField(unique=True)
    seats = models.PositiveIntegerField(default=4)
    is_occupied = models.BooleanField(default=False)

    def __str__(self):
        return f"Table {self.number}"


class MenuItem(BaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Order(BaseModel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("preparing", "Preparing"),
        ("served", "Served"),
        ("paid", "Paid"),
        ("cancelled", "Cancelled"),
    ]
    table = models.ForeignKey(
        Table, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="orders",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    note = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Order {str(self.id)[:8]} ({self.status})"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())


class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)

    @property
    def subtotal(self):
        return self.menu_item.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.menu_item.name}"


class Reservation(BaseModel):
    customer_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    table = models.ForeignKey(
        Table, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="reservations",
    )
    reserved_for = models.DateTimeField()
    party_size = models.PositiveIntegerField(default=2)

    def __str__(self):
        return f"{self.customer_name} @ {self.reserved_for}"


class Inventory(BaseModel):
    item_name = models.CharField(max_length=100)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=20, default="units")   # kg, litres, units
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        verbose_name_plural = "Inventory"

    def __str__(self):
        return self.item_name
