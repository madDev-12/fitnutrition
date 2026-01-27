"""
URL Configuration for FitNutrition project
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('apps.users.urls')),
    path('api/profile/', include('apps.users.urls')),
    path('api/measurements/', include('apps.measurements.urls')),
    path('api/nutrition/', include('apps.nutrition.urls')),
    path('api/workouts/', include('apps.workouts.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/recommendations/', include('apps.recommendations.urls')),
    
    # JWT Token refresh
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Admin site customization
admin.site.site_header = "FitNutrition Administration"
admin.site.site_title = "FitNutrition Admin"
admin.site.index_title = "Welcome to FitNutrition Administration"
