"""
Admin configuration for Measurements app
"""
from django.contrib import admin
from .models import BodyMeasurement, ProgressLog


@admin.register(BodyMeasurement)
class BodyMeasurementAdmin(admin.ModelAdmin):
    """Admin configuration for BodyMeasurement model"""
    list_display = [
        'user', 'date', 'weight', 'body_fat_percentage', 'bmi',
        'weight_change', 'created_at'
    ]
    list_filter = ['date', 'created_at']
    search_fields = ['user__email', 'user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['bmi', 'weight_change', 'body_fat_change', 'created_at', 'updated_at']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('User & Date', {'fields': ('user', 'date')}),
        ('Weight & Body Composition', {
            'fields': ('weight', 'body_fat_percentage', 'muscle_mass', 'bmi', 'weight_change', 'body_fat_change')
        }),
        ('Body Measurements', {
            'fields': (
                'chest', 'waist', 'hips', 'neck', 'shoulders',
                'arms_left', 'arms_right', 'thighs_left', 'thighs_right',
                'calves_left', 'calves_right'
            )
        }),
        ('Additional Info', {'fields': ('notes', 'photo')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(ProgressLog)
class ProgressLogAdmin(admin.ModelAdmin):
    """Admin configuration for ProgressLog model"""
    list_display = [
        'user', 'date', 'energy_level', 'mood', 'sleep_quality',
        'sleep_hours', 'created_at'
    ]
    list_filter = ['date', 'energy_level', 'mood', 'created_at']
    search_fields = ['user__email', 'user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('User & Date', {'fields': ('user', 'date')}),
        ('Subjective Metrics', {
            'fields': ('energy_level', 'mood', 'sleep_quality', 'sleep_hours')
        }),
        ('Physical Condition', {
            'fields': ('soreness_level', 'stress_level')
        }),
        ('Notes', {
            'fields': ('notes', 'achievements', 'challenges')
        }),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
