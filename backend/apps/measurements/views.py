"""
Views for Measurements app
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Avg
from datetime import datetime, timedelta
from .models import BodyMeasurement, ProgressLog
from .serializers import (
    BodyMeasurementSerializer,
    BodyMeasurementCreateSerializer,
    BodyMeasurementListSerializer,
    ProgressLogSerializer,
    ProgressLogCreateSerializer,
    MeasurementHistorySerializer,
    ProgressSummarySerializer
)


class BodyMeasurementListCreateView(generics.ListCreateAPIView):
    """
    List all measurements or create a new one
    GET/POST /api/measurements/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BodyMeasurementCreateSerializer
        return BodyMeasurementListSerializer
    
    def get_queryset(self):
        return BodyMeasurement.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BodyMeasurementDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a measurement
    GET/PUT/PATCH/DELETE /api/measurements/{id}/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return BodyMeasurementCreateSerializer
        return BodyMeasurementSerializer
    
    def get_queryset(self):
        return BodyMeasurement.objects.filter(user=self.request.user)


class ProgressLogListCreateView(generics.ListCreateAPIView):
    """
    List all progress logs or create a new one
    GET/POST /api/measurements/progress-logs/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProgressLogCreateSerializer
        return ProgressLogSerializer
    
    def get_queryset(self):
        return ProgressLog.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProgressLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a progress log
    GET/PUT/PATCH/DELETE /api/measurements/progress-logs/{id}/
    """
    serializer_class = ProgressLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ProgressLog.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def measurement_history(request):
    """
    Get measurement history for charts
    GET /api/measurements/history/
    Query params: days (default: 30)
    """
    days = int(request.query_params.get('days', 30))
    start_date = datetime.now().date() - timedelta(days=days)
    
    measurements = BodyMeasurement.objects.filter(
        user=request.user,
        date__gte=start_date
    ).order_by('date')
    
    data = {
        'dates': [m.date for m in measurements],
        'weights': [m.weight for m in measurements],
        'body_fat_percentages': [m.body_fat_percentage for m in measurements],
        'bmis': [m.bmi for m in measurements],
    }
    
    serializer = MeasurementHistorySerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def progress_summary(request):
    """
    Get progress summary statistics
    GET /api/measurements/summary/
    """
    user = request.user
    
    # Get measurements
    measurements = BodyMeasurement.objects.filter(user=user).order_by('date')
    first_measurement = measurements.first()
    latest_measurement = measurements.last()
    
    # Get progress logs
    progress_logs = ProgressLog.objects.filter(user=user)
    
    # Calculate statistics
    summary = {
        'total_measurements': measurements.count(),
        'total_progress_logs': progress_logs.count(),
        'starting_weight': first_measurement.weight if first_measurement else None,
        'current_weight': latest_measurement.weight if latest_measurement else None,
        'total_weight_change': None,
        'starting_body_fat': first_measurement.body_fat_percentage if first_measurement else None,
        'current_body_fat': latest_measurement.body_fat_percentage if latest_measurement else None,
        'body_fat_change': None,
        'average_energy_level': None,
        'average_sleep_hours': None,
    }
    
    # Calculate weight change
    if first_measurement and latest_measurement:
        summary['total_weight_change'] = float(latest_measurement.weight) - float(first_measurement.weight)
    
    # Calculate body fat change
    if (first_measurement and latest_measurement and 
        first_measurement.body_fat_percentage and latest_measurement.body_fat_percentage):
        summary['body_fat_change'] = (
            float(latest_measurement.body_fat_percentage) - 
            float(first_measurement.body_fat_percentage)
        )
    
    # Calculate averages from progress logs
    if progress_logs.exists():
        averages = progress_logs.aggregate(
            avg_energy=Avg('energy_level'),
            avg_sleep=Avg('sleep_hours')
        )
        summary['average_energy_level'] = round(averages['avg_energy'], 1) if averages['avg_energy'] else None
        summary['average_sleep_hours'] = round(averages['avg_sleep'], 1) if averages['avg_sleep'] else None
    
    serializer = ProgressSummarySerializer(summary)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def latest_measurement(request):
    """
    Get the latest body measurement
    GET /api/measurements/latest/
    """
    measurement = BodyMeasurement.objects.filter(
        user=request.user
    ).order_by('-date').first()
    
    if measurement:
        serializer = BodyMeasurementSerializer(measurement)
        return Response(serializer.data)
    
    return Response({
        'message': 'No measurements found'
    }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def measurement_comparison(request):
    """
    Compare current measurements with starting measurements
    GET /api/measurements/comparison/
    """
    measurements = BodyMeasurement.objects.filter(
        user=request.user
    ).order_by('date')
    
    if measurements.count() < 2:
        return Response({
            'message': 'Need at least 2 measurements for comparison'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    first = measurements.first()
    latest = measurements.last()
    
    comparison = {
        'starting': BodyMeasurementSerializer(first).data,
        'current': BodyMeasurementSerializer(latest).data,
        'changes': {
            'weight': float(latest.weight) - float(first.weight),
            'body_fat_percentage': (
                float(latest.body_fat_percentage) - float(first.body_fat_percentage)
                if latest.body_fat_percentage and first.body_fat_percentage else None
            ),
            'chest': (
                float(latest.chest) - float(first.chest)
                if latest.chest and first.chest else None
            ),
            'waist': (
                float(latest.waist) - float(first.waist)
                if latest.waist and first.waist else None
            ),
            'hips': (
                float(latest.hips) - float(first.hips)
                if latest.hips and first.hips else None
            ),
        },
        'days_tracked': (latest.date - first.date).days,
    }
    
    return Response(comparison)
