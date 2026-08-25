from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.tenant.core.models import BaseModel


class Role(BaseModel):
    """A staff role within this restaurant.

    Permission checks key off `slug`, which is a fixed set -- predictable to
    reason about and hard to lock yourself out of. The `permissions` M2M stays
    for per-role fine tuning on top of the slug, not as the primary mechanism.
    """

    OWNER = "owner"
    MANAGER = "manager"
    CASHIER = "cashier"
    WAITER = "waiter"
    CHEF = "chef"
    SLUG_CHOICES = [
        (OWNER, "Owner"),
        (MANAGER, "Manager"),
        (CASHIER, "Cashier"),
        (WAITER, "Waiter"),
        (CHEF, "Chef"),
    ]
    # Seeded into every new tenant, highest privilege first.
    DEFAULT_ORDER = [OWNER, MANAGER, CASHIER, WAITER, CHEF]

    slug = models.SlugField(max_length=20, choices=SLUG_CHOICES, unique=True)
    name = models.CharField(max_length=50)
    permissions = models.ManyToManyField("auth.Permission", blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TenantUser(AbstractUser, BaseModel):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    # Null means "not tied to one location" -- owners and multi-branch managers.
    branch = models.ForeignKey(
        "core.Branch", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="staff",
    )
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    profile_data = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.username

    @property
    def role_slug(self):
        return self.role.slug if self.role_id else None

    def has_role(self, *slugs):
        return self.role_slug in slugs
