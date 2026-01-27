from django.urls import path
from .views import (
    WorkoutRecommendationsView,
    NutritionRecommendationsView,
    PersonalizedPlanView,
    AIInsightsView,
    DailyRecommendationsView
)

urlpatterns = [
    path('workouts/', WorkoutRecommendationsView.as_view(), name='workout-recommendations'),
    path('nutrition/', NutritionRecommendationsView.as_view(), name='nutrition-recommendations'),
    path('personalized-plan/', PersonalizedPlanView.as_view(), name='personalized-plan'),
    path('ai-insights/', AIInsightsView.as_view(), name='ai-insights'),
    path('daily/', DailyRecommendationsView.as_view(), name='daily-recommendations'),
]
