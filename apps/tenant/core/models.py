import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models


class BaseModel(models.Model):
    """Abstract base every tenant model inherits."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_deleted = True
        self.save(update_fields=["is_deleted"])


class Branch(BaseModel):
    """One physical location of this restaurant business.

    Every tenant gets a "Main" branch at signup, so single-location
    restaurants never see this concept -- but tables, orders, stock and staff
    all hang off a branch from day one, which is what makes franchise support
    a UI feature later instead of a migration across every live schema.
    """

    name = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    timezone = models.CharField(max_length=50, default="Asia/Kathmandu")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Branches"

    def __str__(self):
        return self.name


class TenantSettings(BaseModel):
    """Business-wide settings. Exactly one row per tenant schema."""

    currency = models.CharField(max_length=3, default="NPR")
    currency_symbol = models.CharField(max_length=5, default="Rs.")
    service_charge_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("10.00"),
        help_text="Applied to the order subtotal before tax. 0 to disable.",
    )
    invoice_prefix = models.CharField(max_length=10, default="INV")
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Tenant settings"
        verbose_name_plural = "Tenant settings"

    def __str__(self):
        return f"Settings ({self.currency})"

    @classmethod
    def load(cls):
        """The singleton for the current schema, created on first access."""
        obj = cls.objects.first()
        if obj is None:
            obj = cls.objects.create()
        return obj


class TaxRate(BaseModel):
    """A named tax, so a second market doesn't mean rewriting billing.

    is_compound handles the Nepali case where VAT applies on top of the
    service charge rather than only to the item subtotal.
    """

    ITEM = "item"
    SERVICE_CHARGE = "service_charge"
    ORDER = "order"
    APPLIES_TO_CHOICES = [
        (ITEM, "Item subtotal"),
        (SERVICE_CHARGE, "Service charge"),
        (ORDER, "Whole order"),
    ]

    name = models.CharField(max_length=50)
    percent = models.DecimalField(max_digits=5, decimal_places=2)
    applies_to = models.CharField(max_length=20, choices=APPLIES_TO_CHOICES, default=ITEM)
    is_compound = models.BooleanField(
        default=False,
        help_text="Charge on top of other taxes rather than on the base amount.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.percent}%)"


class AuditLog(BaseModel):
    """Append-only trail of who changed what.

    Exists from the first migration on purpose: audit history cannot be
    backfilled, so anything not recorded before a retrofit is gone for good.
    """

    CREATED = "created"
    UPDATED = "updated"
    DELETED = "deleted"
    VOIDED = "voided"
    REFUNDED = "refunded"
    PRICE_CHANGED = "price_changed"
    ACTION_CHOICES = [
        (CREATED, "Created"),
        (UPDATED, "Updated"),
        (DELETED, "Deleted"),
        (VOIDED, "Voided"),
        (REFUNDED, "Refunded"),
        (PRICE_CHANGED, "Price changed"),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="audit_logs",
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=50)
    object_id = models.UUIDField()
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["model_name", "object_id"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.action} {self.model_name} by {self.actor or 'system'}"
