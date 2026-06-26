from rest_framework import serializers

from apps.tenant.users.models import Role, TenantUser


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "created_at", "updated_at"]


class TenantUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantUser
        fields = ["id", "username", "email", "phone", "role", "is_active"]