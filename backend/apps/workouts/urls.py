from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExerciseViewSet, ExerciseMediaViewSet, WorkoutPlanViewSet, WorkoutViewSet,
    WorkoutScheduleViewSet, FavoriteExerciseViewSet
)

router = DefaultRouter()
router.register(r'exercises', ExerciseViewSet, basename='exercise')
router.register(r'exercise-media', ExerciseMediaViewSet, basename='exercise-media')
router.register(r'workout-plans', WorkoutPlanViewSet, basename='workout-plan')
router.register(r'workouts', WorkoutViewSet, basename='workout')
router.register(r'schedules', WorkoutScheduleViewSet, basename='workout-schedule')
router.register(r'favorites', FavoriteExerciseViewSet, basename='favorite-exercise')

urlpatterns = [
    path('', include(router.urls)),
]
