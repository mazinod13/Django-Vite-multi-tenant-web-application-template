from django.shortcuts import render
from rest_framework import serializers, viewsets
from rest_framework.permissions import AllowAny

from .models import Tenant, Domain


class TenantSerializer(serializers.ModelSerializer):
    # write-only input; the Domain row is created/updated alongside the tenant.
    # required=False so editing (PATCH) doesn't force a domain.
    domain = serializers.CharField(write_only=True, required=False)
    primary_domain = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            "id", "name", "slug", "category", "plan",
            "domain", "primary_domain", "created_on",
        ]
        read_only_fields = ["id", "created_on"]

    def get_primary_domain(self, obj):
        d = obj.domains.filter(is_primary=True).first()
        return d.domain if d else None

    def create(self, validated_data):
        domain_name = validated_data.pop("domain", None)
        if not domain_name:
            raise serializers.ValidationError({"domain": "This field is required."})
        # slug doubles as the PostgreSQL schema name
        tenant = Tenant(schema_name=validated_data["slug"], **validated_data)
        tenant.save()  # auto_create_schema=True -> creates the schema + runs tenant migrations
        Domain.objects.create(domain=domain_name, tenant=tenant, is_primary=True)
        return tenant

    def update(self, instance, validated_data):
        domain_name = validated_data.pop("domain", None)
        validated_data.pop("slug", None)   # never rename a live schema
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if domain_name:
            primary = instance.domains.filter(is_primary=True).first()
            if primary:
                primary.domain = domain_name
                primary.save()
            else:
                Domain.objects.create(domain=domain_name, tenant=instance, is_primary=True)
        return instance


class TenantViewSet(viewsets.ModelViewSet):
    """Platform-admin API to list/create tenants.

    DEV ONLY: open to everyone. In production this MUST be restricted to
    platform admins (the public schema has no per-tenant users to auth against).
    """
    queryset = Tenant.objects.exclude(schema_name="public").order_by("-created_on")
    serializer_class = TenantSerializer
    permission_classes = [AllowAny]   # TODO: protect in production


def public_landing(request):
    """The platform-admin single-page app (served on the bare domain)."""
    return render(request, "public/landing.html")
