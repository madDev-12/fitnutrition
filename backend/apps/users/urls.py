"""
URL Configuration for Users app
"""
from django.urls import path
from .views import (
    UserRegistrationView,
    UserLoginView,
    UserLogoutView,
    UserProfileView,
    UserProfileDetailView,
    UserProfileCreateView,
    FoodPreferenceView,
    UserPreferencesView,
    ChangePasswordView,
    get_user_stats,
    upload_profile_picture,
)

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('me/', UserProfileView.as_view(), name='current-user'),
    
    # User Profile
    path('', UserProfileView.as_view(), name='profile'),
    path('details/', UserProfileDetailView.as_view(), name='profile-details'),
    path('create/', UserProfileCreateView.as_view(), name='profile-create'),
    path('stats/', get_user_stats, name='user-stats'),
    path('upload-picture/', upload_profile_picture, name='upload-picture'),
    
    # Food Preferences
    path('food-preferences/', FoodPreferenceView.as_view(), name='food-preferences'),
    
    # User Preferences
    path('preferences/', UserPreferencesView.as_view(), name='preferences'),
    
    # Password Management
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]
