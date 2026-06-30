"""URLs for the PUBLIC schema only (the bare domain, e.g. localhost:8000).

Tenants (subdomains) use config.urls instead. Wired via PUBLIC_SCHEMA_URLCONF.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.public.tenants.views import TenantViewSet, public_landing

router = DefaultRouter()
router.register("tenants", TenantViewSet, basename="tenant")

urlpatterns = [
    path("api/", include(router.urls)),
    path("", public_landing, name="public-landing"),
]
