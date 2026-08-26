from django.shortcuts import render

# Create your views here.
from apps.tenant.api.views import TenantBaseViewSet
from .models import MenuCategory,MenuItem,MenuVariant,Modifier,ModifierGroup
from .seralizers import MenuCategorySerializer,MenuItemSerializer,MenuVariantSerializer,ModifierGroupSerializer,ModifierSerializer


class MenuCategoryViewset(TenantBaseViewSet):
    queryset = MenuCategory.objects.all()
    serializer_class = MenuCategorySerializer
    filterset_fields = ["is_active"]
    
    def get_queryset(self):
        return(
            super()
            .get_queryset()
            .prefetch_related(
                "items__variants",
                "items__modifier_groups__modifers",    
            )
        ) 

class MenuItemViewset(TenantBaseViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    filterset_fields = ["category","is_available"]        

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .select_related("category")
            .prefetch_related("variants", "modifier_groups__modifiers")
        )


class MenuVariantViewSet(TenantBaseViewSet):
    queryset = MenuVariant.objects.all()
    serializer_class = MenuVariantSerializer
    filterset_fields = ["item"]


class ModifierGroupViewSet(TenantBaseViewSet):
    queryset = ModifierGroup.objects.all()
    serializer_class = ModifierGroupSerializer
    filterset_fields = ["item"]


class ModifierViewSet(TenantBaseViewSet):
    queryset = Modifier.objects.all()
    serializer_class = ModifierSerializer
    filterset_fields = ["group"]