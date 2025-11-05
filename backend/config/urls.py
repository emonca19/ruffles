"""
URL configuration for Ruffles project.
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularSwaggerView, SpectacularRedocView, SpectacularAPIView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API v1
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/raffles/', include('apps.raffles.urls')),
    path('api/v1/purchases/', include('apps.purchases.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
]
