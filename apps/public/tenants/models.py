from django.db import models
from django_tenants.models import TenantMixin, DomainMixin

class Tenant(TenantMixin):
    """One restaurant. Its slug doubles as the PostgreSQL schema name."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    plan = models.CharField(
        max_length=20,
        choices=[("free","Free"),("pro","Pro"),("enterprise","Enterprise")],
        default="free",
    )
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict,blank=True)
    created_on = models.DateField(auto_now_add=True)
    
    auto_create_schema = True
    # Deliberately False: deleting a Tenant row must not silently DROP a live
    # restaurant's schema. Drop it by hand once you're sure:
    #   DROP SCHEMA "<slug>" CASCADE;
    auto_drop_schema = False

    def __str__(self):
        return self.name
    

class Domain(DomainMixin):
    pass
    