from django.db import models
from django.contrib.auth.models import User
import json

# Create your models here.
class Producto(models.Model):
  name = models.CharField(max_length=200)
  links = models.JSONField(null=True, blank=True)
  images = models.JSONField(null=True, blank=True)
  description = models.TextField(null=True, blank=True)
  created = models.DateTimeField(auto_now_add=True)
  user_id = models.ForeignKey(User, on_delete=models.CASCADE)
  pillado_user = models.ForeignKey(User, null=True, on_delete=models.DO_NOTHING, related_name='productos_pillados')
  

  def __str__(self):
    return self.name + ' (' + self.user_id.username + ')'