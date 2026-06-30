from django.db import models
from django_tenants.models import TenantMixin, DomainMixin

class Tenant(TenantMixin):
    CATEGORY_CHOICES = [
        ("school", "School Managemnet"),
        ("restaurant", "Restaurant Management"),
        ("Library", "Library Managemnet"),
    ]
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="school")
    plan = models.CharField(
        max_length=20,
        choices=[("free","Free"),("pro","Pro"),("enterprise","Enterprise")],
        default="free",
    )
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict,blank=True)
    created_on = models.DateField(auto_now_add=True)
    
    auto_create_schema = True
    auto_drop_schema = True   # deleting a Tenant also DROPS its schema (destructive!)

    def __str__(self):
        return self.name
    

class Domain(DomainMixin):
    pass
    