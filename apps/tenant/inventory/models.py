from django.db import models
from apps.tenant.core.models import BaseModel
from apps.tenant.users.models import TenantUser


class Supplier(BaseModel):
    name = models.CharField(max_length=150)
    contact_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Product(BaseModel):
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, blank=True, default="General")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    quantity_on_hand = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=5)
    supplier = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="products"
    )

    def __str__(self):
        return f"{self.name} ({self.sku})"


class StockTransaction(BaseModel):
    TYPE_CHOICES = [
        ("IN", "Stock In / Restock"),
        ("OUT", "Stock Out / Dispatch"),
        ("ADJUST", "Inventory Adjustment"),
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="transactions")
    transaction_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    quantity = models.IntegerField()  # positive for IN/ADJUST, negative for OUT/ADJUST if decreasing
    transaction_date = models.DateTimeField(auto_now_add=True)
    performed_by = models.ForeignKey(
        TenantUser, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="transactions"
    )
    reference = models.CharField(max_length=100, blank=True)  # e.g., Invoice #, PO #, Reason

    def __str__(self):
        return f"{self.transaction_type} - {self.product.name} ({self.quantity})"
