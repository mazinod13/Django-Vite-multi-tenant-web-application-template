from rest_framework.routers import DefaultRouter

from .views import RoleViewSet, TenantUserViewSet

router = DefaultRouter()
router.register("roles", RoleViewSet)
router.register("users", TenantUserViewSet)

urlpatterns = router.urls