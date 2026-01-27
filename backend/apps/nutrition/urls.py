"""
URL configuration for Nutrition app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FoodViewSet, MealViewSet, MealPlanViewSet,
    FavoriteFoodViewSet, FavoriteMealViewSet, RecipeViewSet
)

router = DefaultRouter()
router.register(r'foods', FoodViewSet, basename='food')
router.register(r'meals', MealViewSet, basename='meal')
router.register(r'meal-plans', MealPlanViewSet, basename='mealplan')
router.register(r'favorite-foods', FavoriteFoodViewSet, basename='favoritefood')
router.register(r'favorite-meals', FavoriteMealViewSet, basename='favoritemeal')
router.register(r'recipes', RecipeViewSet, basename='recipe')

urlpatterns = [
    path('', include(router.urls)),
]
