
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home),
    path('registro/', views.registro, name = 'registro'),
    path('login/', views.login, name = 'login'),
    path('<str:username>', views.carta, name='carta'),
    path('logout/', views.logout, name = 'logout'),
    path('pillados/', views.pillados, name = 'pillados'),
    path('editor/', views.editor, name = 'editor'),
    path('editor/crear_producto', views.crearProducto, name='crear_producto'),
    path('editor/editar_producto', views.editarProducto, name='editar_producto'),
    path('api/pillar_producto/<int:producto_id>/', views.pillar_producto, name='pillar_producto_api'),
    path('api/despillar_producto/<int:producto_id>/', views.despillar_producto, name='despillar_producto_api'),
    path('api/borrar_producto/<int:producto_id>/', views.borrar_producto, name='despillar_producto_api')
]
