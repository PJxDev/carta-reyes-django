from django.db import IntegrityError
from django.shortcuts import get_object_or_404, redirect, render
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from .models import Producto
from django.contrib.auth import login as djangoLogin, logout as djangoLogout, authenticate
from django.contrib.auth.decorators import login_required
from .forms import ProductoForm


# Create your views here.
def home(request):
  return render(request, 'home.html')



def login(request):
    
  if(request.method == 'GET'):
    return render(request, 'login.html', {'form': AuthenticationForm})

  if(request.method == 'POST'):
    formData = request.POST
    
    user = authenticate(request, username=formData['username'], password=formData['password'])
    if user is None:
      error = 'Usuario no existe o contraseña incorrecta'
      return render(request, 'login.html', {'form': AuthenticationForm, 'error' : error})
    else:        
      djangoLogin(request, user)
      return redirect('/')
    
    
    
      
def registro(request):
  
  if(request.method == 'GET'):
    return render(request, 'registro.html', {'form': UserCreationForm})

  if(request.method == 'POST'):
    formData = request.POST
    
    if(formData['password1'] == formData['password2']):
      try: 
        user = User.objects.create_user(username = formData['username'], password = formData['password1'])
        user.save()
        
        djangoLogin(request, user)
        return redirect('/')
      
      except IntegrityError:
        error = 'Usuario ya existe'
        return render(request, 'registro.html', {'form': UserCreationForm, 'error' : error})
      
    else:
      error = 'Las contraseñas no coinciden'
      return render(request, 'registro.html', {'form': UserCreationForm, 'error' : error})
      
      
def logout(request):
  djangoLogout(request)
  return redirect('/') 

@login_required
def editor(request):
    if(request.method == 'GET'):
      productos = Producto.objects.filter(user_id = request.user)
      
      
      productos_converted = []
      for producto in productos:

        productos_converted.append({
            'id': producto.id,
            'name': producto.name,
            'links': (producto.links or []),
            'has_multiple_links': len(producto.links or []) > 1,
            'images': (producto.images or []),
            'has_multiple_images': len(producto.images or []) > 1,
            'description': producto.description,
            'created': producto.created,
            'user_id': producto.user_id.username,
        })
      
      return render(request, 'editor.html', {'form': ProductoForm, 'productos': productos_converted})
    
    
@login_required
def crearProducto(request):
  if(request.method == 'GET'):
      return redirect('editor') 
    
  if(request.method == 'POST'):
    
    post_data = request.POST.copy()
    
    if 'links' in post_data:
      links_raw = post_data['links']
      post_data['links'] = [link.strip() for link in links_raw.split(',') if link.strip()]
    if 'images' in post_data:
      images_raw = post_data['images']
      post_data['images'] = [image.strip() for image in images_raw.split(',') if image.strip()]

    print(request.POST)
    print('\n')
    
    formData = ProductoForm(post_data)
    
    if formData.is_valid():
      newProduct = formData.save(commit=False)
      newProduct.user_id = request.user
      newProduct.save()
      return redirect('editor')
    else:
      print(formData.errors)
      return render(request, 'editor.html', {'form': formData, 'error' : formData.errors})

@login_required
def editarProducto(request, producto_id):
  if(request.method == 'GET'):
      return redirect('editor') 
    
  if(request.method == 'POST'):
    
    post_data = request.POST.copy()
        
    if 'links' in post_data:
      links_raw = post_data['links']
      post_data['links'] = [link.strip() for link in links_raw.split(',') if link.strip()]
    if 'images' in post_data:
      images_raw = post_data['images']
      post_data['images'] = [image.strip() for image in images_raw.split(',') if image.strip()]
      
    print(request.POST)
    print('\n')
    
    formData = ProductoForm(post_data)
    
    if formData.is_valid():
      producto = get_object_or_404(Producto, id=producto_id)
      producto.name = post_data['name']
      producto.description = post_data['description']
      producto.links = post_data['links']
      producto.images = post_data['images']
      producto.save()
    
      return redirect('editor')
    else:
      print(formData.errors)
      return render(request, 'editor.html', {'form': formData, 'error' : formData.errors})
      

def carta(request, username):
  try:
    user = User.objects.get(username = username)
    productos = Producto.objects.filter(user_id = user.id)
    

    productos_converted = []
    for producto in productos:

      productos_converted.append({
          'id': producto.id,
          'name': producto.name,
          'links': (producto.links or []),
          'has_multiple_links': len(producto.links or []) > 1,
          'images': (producto.images or []),
          'has_multiple_images': len(producto.images or []) > 1,
          'description': producto.description,
          'created': producto.created,
          'user_id': producto.user_id.username,
          'esta_pillado': producto.pillado_user != None,
          'user_lo_pillo': producto.pillado_user == request.user,
      })
          
    return render(request, 'carta.html', {'usuario_carta':user, 'productos': productos_converted, 'es_author':user.id == request.user.id})
  except:
    return HttpResponse(f"Usuario no encontrado") 
  
  
@login_required
def pillar_producto(request, producto_id):
  if request.method == "POST":  
      producto = get_object_or_404(Producto, id=producto_id)
      producto.pillado_user = request.user
      producto.save()
      return JsonResponse({"success": True, "nuevo_estado": producto.pillado_user.username})
  return JsonResponse({"success": False}, status=400)

@login_required
def despillar_producto(request, producto_id):
  if request.method == "POST":  
      producto = get_object_or_404(Producto, id=producto_id)
      producto.pillado_user = None
      producto.save()
      return JsonResponse({"success": True})
  return JsonResponse({"success": False}, status=400)
