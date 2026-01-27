"""
Admin configuration for Users app
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, FoodPreference, UserPreferences


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""
    list_display = ['email', 'username', 'first_name', 'last_name', 'is_staff', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'date_of_birth', 'profile_picture')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin configuration for UserProfile model"""
    list_display = [
        'user', 'gender', 'height', 'current_weight', 'target_weight',
        'fitness_goal', 'activity_level', 'bmi', 'created_at'
    ]
    list_filter = ['gender', 'fitness_goal', 'activity_level', 'created_at']
    search_fields = ['user__email', 'user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['bmi', 'bmr', 'tdee', 'daily_calorie_target', 'created_at', 'updated_at']
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Basic Info', {'fields': ('gender', 'height', 'current_weight', 'target_weight', 'body_fat_percentage')}),
        ('Fitness Info', {'fields': ('activity_level', 'fitness_goal')}),
        ('Body Measurements', {'fields': ('chest', 'waist', 'hips', 'arms', 'thighs', 'calves')}),
        ('Calculated Metrics', {'fields': ('bmi', 'bmr', 'tdee', 'daily_calorie_target')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(FoodPreference)
class FoodPreferenceAdmin(admin.ModelAdmin):
    """Admin configuration for FoodPreference model"""
    list_display = ['user', 'diet_type', 'created_at']
    list_filter = ['diet_type', 'created_at']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Diet Preferences', {'fields': ('diet_type',)}),
        ('Restrictions', {'fields': ('allergies', 'dislikes', 'avoid_ingredients')}),
        ('Preferences', {'fields': ('preferred_foods',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    """Admin configuration for UserPreferences model"""
    list_display = ['user', 'email_notifications', 'workout_reminders', 'meal_reminders', 'progress_updates', 'weekly_summary']
    list_filter = ['email_notifications', 'workout_reminders', 'meal_reminders', 'progress_updates', 'weekly_summary']
    search_fields = ['user__email', 'user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Notification Settings', {'fields': ('email_notifications', 'workout_reminders', 'meal_reminders', 'progress_updates', 'weekly_summary')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
