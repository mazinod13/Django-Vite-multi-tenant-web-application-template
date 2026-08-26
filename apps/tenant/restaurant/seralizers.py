from rest_framework import serializers
from apps.tenant.restaurant.models import MenuCategory,MenuItem,MenuVariant,Modifier,ModifierGroup

class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = '__all__'

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'

class MenuVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'                

class ModifierGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModifierGroup
        fields = '__all__' 

class ModifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modifier
        fields = '__all__'               