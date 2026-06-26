from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.tenant.users.models import Role, TenantUser
from .serializers import RoleSerializer, TenantUserSerializer


class TenantBaseViewSet(ModelViewSet):
    """Inherit this in every tenant API ViewSet.
    django-tenants already scopes queries to the current schema."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # hides soft-deleted rows when the model supports it
        qs = super().get_queryset()
        if hasattr(qs.model, "is_deleted"):
            return qs.filter(is_deleted=False)
        return qs


class RoleViewSet(TenantBaseViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer


class TenantUserViewSet(TenantBaseViewSet):
    queryset = TenantUser.objects.all()
    serializer_class = TenantUserSerializer