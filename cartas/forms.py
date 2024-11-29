from django.forms import ModelForm
from .models import Producto

class ProductoForm (ModelForm):
  class Meta:
    model = Producto
    fields = ["name", "links", "images", "description"]