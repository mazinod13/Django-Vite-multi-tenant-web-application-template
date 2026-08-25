from django.db import models

from apps.tenant.core.models import BaseModel

class MenuCategory(BaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name_plural = "Menu categories"

    def __str__(self):
        return self.name


class MenuItem(BaseModel):
    category = models.ForeignKey(
        MenuCategory, on_delete=models.CASCADE, related_name="items"
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_available = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name


class MenuVariant(BaseModel):
    """e.g. Small / Medium / Large, or Half / Full — each with its own price."""
    item = models.ForeignKey(
        MenuItem, on_delete=models.CASCADE, related_name="variants"
    )
    name = models.CharField(max_length=50)  # e.g. "Full"
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_default = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return f"{self.item.name} — {self.name}"


class ModifierGroup(BaseModel):
    """e.g. 'Choose your spice level', 'Add-ons'"""
    item = models.ForeignKey(
        MenuItem, on_delete=models.CASCADE, related_name="modifier_groups"
    )
    name = models.CharField(max_length=100)
    is_required = models.BooleanField(default=False)
    min_select = models.PositiveIntegerField(default=0)
    max_select = models.PositiveIntegerField(default=1)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return f"{self.item.name} — {self.name}"


class Modifier(BaseModel):
    """e.g. 'Mild', 'Extra cheese' — an option within a ModifierGroup"""
    group = models.ForeignKey(
        ModifierGroup, on_delete=models.CASCADE, related_name="modifiers"
    )
    name = models.CharField(max_length=100)
    price_delta = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_available = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return self.name