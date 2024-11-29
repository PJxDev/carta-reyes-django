from django.contrib import admin
from .models import Producto

class ProductoAdmin (admin.ModelAdmin):
  readonly_fields = ("created", )

# Register your models here.
admin.site.register(Producto, ProductoAdmin)