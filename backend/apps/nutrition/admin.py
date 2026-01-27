"""
Admin configuration for Nutrition app
"""
from django.contrib import admin
from .models import (
    Food, Meal, MealItem, MealPlan,
    FavoriteFood, FavoriteMeal, FavoriteMealItem, Recipe
)


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    """Admin configuration for Food model"""
    list_display = [
        'name', 'brand', 'category', 'calories', 'protein',
        'carbohydrates', 'fats', 'is_custom', 'created_by'
    ]
    list_filter = ['category', 'is_custom', 'created_at']
    search_fields = ['name', 'brand', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'category', 'brand', 'serving_size', 'description', 'image')
        }),
        ('Macronutrients', {
            'fields': ('calories', 'protein', 'carbohydrates', 'fats', 'fiber', 'sugar', 'sodium')
        }),
        ('Micronutrients', {
            'fields': ('vitamin_a', 'vitamin_c', 'calcium', 'iron'),
            'classes': ('collapse',)
        }),
        ('Custom Food', {
            'fields': ('is_custom', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class MealItemInline(admin.TabularInline):
    """Inline admin for MealItem"""
    model = MealItem
    extra = 1
    readonly_fields = ['calories', 'protein', 'carbohydrates', 'fats']
    fields = ['food', 'serving_size', 'calories', 'protein', 'carbohydrates', 'fats']


@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    """Admin configuration for Meal model"""
    list_display = ['user', 'name', 'meal_type', 'date', 'time', 'total_calories']
    list_filter = ['meal_type', 'date', 'created_at']
    search_fields = ['user__email', 'user__username', 'name']
    readonly_fields = ['total_calories', 'total_protein', 'total_carbs', 'total_fats', 'created_at', 'updated_at']
    date_hierarchy = 'date'
    inlines = [MealItemInline]
    
    fieldsets = (
        ('User & Basic Info', {
            'fields': ('user', 'name', 'meal_type', 'date', 'time')
        }),
        ('Details', {
            'fields': ('notes', 'image')
        }),
        ('Nutrition Summary', {
            'fields': ('total_calories', 'total_protein', 'total_carbs', 'total_fats'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MealItem)
class MealItemAdmin(admin.ModelAdmin):
    """Admin configuration for MealItem model"""
    list_display = ['meal', 'food', 'serving_size', 'calories', 'protein', 'carbohydrates', 'fats']
    list_filter = ['meal__meal_type', 'created_at']
    search_fields = ['meal__name', 'food__name']
    readonly_fields = ['calories', 'protein', 'carbohydrates', 'fats', 'created_at']


@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    """Admin configuration for MealPlan model"""
    list_display = [
        'name', 'goal', 'daily_calories', 'protein_percentage',
        'carbs_percentage', 'fats_percentage', 'duration_days', 'is_active'
    ]
    list_filter = ['goal', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'goal', 'duration_days', 'is_active')
        }),
        ('Nutrition Targets', {
            'fields': (
                'daily_calories', 'protein_percentage',
                'carbs_percentage', 'fats_percentage'
            )
        }),
        ('Creator', {
            'fields': ('created_by',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FavoriteFood)
class FavoriteFoodAdmin(admin.ModelAdmin):
    """Admin configuration for FavoriteFood model"""
    list_display = ['user', 'food', 'added_at']
    list_filter = ['added_at']
    search_fields = ['user__email', 'user__username', 'food__name']
    readonly_fields = ['added_at']


class FavoriteMealItemInline(admin.TabularInline):
    """Inline admin for FavoriteMealItem"""
    model = FavoriteMealItem
    extra = 1
    fields = ['food', 'serving_size']


@admin.register(FavoriteMeal)
class FavoriteMealAdmin(admin.ModelAdmin):
    """Admin configuration for FavoriteMeal model"""
    list_display = ['user', 'name', 'meal_type', 'created_at']
    list_filter = ['meal_type', 'created_at']
    search_fields = ['user__email', 'user__username', 'name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [FavoriteMealItemInline]
    
    fieldsets = (
        ('User & Basic Info', {
            'fields': ('user', 'name', 'meal_type', 'description')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(FavoriteMealItem)
class FavoriteMealItemAdmin(admin.ModelAdmin):
    """Admin configuration for FavoriteMealItem model"""
    list_display = ['favorite_meal', 'food', 'serving_size']
    search_fields = ['favorite_meal__name', 'food__name']


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    """Admin configuration for Recipe model"""
    list_display = ['user', 'name', 'calories', 'time', 'servings', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'user__username', 'name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User & Basic Info', {
            'fields': ('user', 'name', 'description', 'time', 'servings', 'image')
        }),
        ('Nutrition Information', {
            'fields': ('calories', 'protein', 'carbs', 'fats')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
