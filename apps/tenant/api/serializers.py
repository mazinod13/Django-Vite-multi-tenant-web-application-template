from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from apps.tenant.users.models import Role, TenantUser


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "created_at", "updated_at"]


class TenantUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantUser
        fields = ["id", "username", "email", "phone", "role", "is_active"]
        
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = TenantUser
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        user = TenantUser(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
        )
        user.set_password(validated_data["password"])   # hashes it (never store raw)
        user.save()
        return user
        