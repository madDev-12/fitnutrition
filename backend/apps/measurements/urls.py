"""
URL Configuration for Measurements app
"""
from django.urls import path
from .views import (
    BodyMeasurementListCreateView,
    BodyMeasurementDetailView,
    ProgressLogListCreateView,
    ProgressLogDetailView,
    measurement_history,
    progress_summary,
    latest_measurement,
    measurement_comparison,
)

app_name = 'measurements'

urlpatterns = [
    # Body Measurements
    path('', BodyMeasurementListCreateView.as_view(), name='measurement-list-create'),
    path('<int:pk>/', BodyMeasurementDetailView.as_view(), name='measurement-detail'),
    path('latest/', latest_measurement, name='latest-measurement'),
    path('history/', measurement_history, name='measurement-history'),
    path('comparison/', measurement_comparison, name='measurement-comparison'),
    path('summary/', progress_summary, name='progress-summary'),
    
    # Progress Logs
    path('progress-logs/', ProgressLogListCreateView.as_view(), name='progress-log-list-create'),
    path('progress-logs/<int:pk>/', ProgressLogDetailView.as_view(), name='progress-log-detail'),
]
