from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.tenant.core.models import BaseModel


class Role(BaseModel):
    name=models.CharField(max_length=50)
    permissions = models.ManyToManyField("auth.Permission", blank=True)
    
    def __str__(self):
        return self.name
    

class TenantUser(AbstractUser, BaseModel):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL,null=True,blank=True) 
    avatar = models.ImageField(upload_to="avatars/",null=True,blank=True) 
    phone = models.CharField(max_length=20, blank=True)
    profile_data = models.JSONField(default=dict,blank=True)
    
    def __str__(self):
        return self.username  