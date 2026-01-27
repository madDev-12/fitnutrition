from django.urls import path
from .views import (
    MetabolismView, MacroCalculatorView, ProgressAnalysisView,
    GoalProgressView, DashboardStatsView, CalorieCalculatorView
)

urlpatterns = [
    path('metabolism/', MetabolismView.as_view(), name='metabolism'),
    path('macros/', MacroCalculatorView.as_view(), name='macros'),
    path('progress/', ProgressAnalysisView.as_view(), name='progress'),
    path('goal-progress/', GoalProgressView.as_view(), name='goal-progress'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('calorie-calculator/', CalorieCalculatorView.as_view(), name='calorie-calculator'),
]
