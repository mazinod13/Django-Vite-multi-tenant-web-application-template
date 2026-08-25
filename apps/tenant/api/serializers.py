from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from apps.tenant.core.bootstrap import MAIN_BRANCH_NAME
from apps.tenant.core.models import Branch
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

        # First account in a fresh restaurant becomes the owner, on the Main
        # branch, so a newly provisioned tenant is usable without hand-editing
        # the database. Everyone after them signs up unassigned.
        if not TenantUser.objects.exists():
            user.is_staff = True
            user.is_superuser = True
            user.role = Role.objects.filter(slug=Role.OWNER).first()
            user.branch = Branch.objects.filter(name=MAIN_BRANCH_NAME).first()

        user.save()
        return user
        