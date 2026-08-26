from rest_framework.routers import DefaultRouter
from .views import (
    MenuCategoryViewset,
    MenuVariantViewSet,
    MenuItemViewset,
    ModifierViewSet,
    ModifierGroupViewSet,
)

router = DefaultRouter()
router.register("menu-categories", MenuCategoryViewset, basename="menu-categories")
router.register("menu-items",MenuItemViewset, basename="menu-item")
router.register("menu-variants",MenuVariantViewSet, basename="menu-variant")
router.register("modifier-groups",ModifierGroupViewSet, basename="modifer-group")
router.register("modifiers",ModifierViewSet, basename="modifer")

urlpatterns = router.urls
