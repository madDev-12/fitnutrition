"""
Serializers for Measurements models
"""
from rest_framework import serializers
from .models import BodyMeasurement, ProgressLog


class BodyMeasurementSerializer(serializers.ModelSerializer):
    """Serializer for BodyMeasurement model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    bmi = serializers.ReadOnlyField()
    weight_change = serializers.ReadOnlyField()
    body_fat_change = serializers.ReadOnlyField()
    
    class Meta:
        model = BodyMeasurement
        fields = [
            'id', 'user', 'user_name', 'date', 'weight', 'height', 'body_fat_percentage',
            'muscle_mass', 'chest', 'waist', 'hips', 'arms_left', 'arms_right',
            'thighs_left', 'thighs_right', 'calves_left', 'calves_right',
            'neck', 'shoulders', 'notes', 'photo', 'bmi', 'weight_change',
            'body_fat_change', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class BodyMeasurementCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating BodyMeasurement"""
    # Accept simplified field names from frontend
    arms = serializers.DecimalField(max_digits=5, decimal_places=1, required=False, write_only=True)
    thighs = serializers.DecimalField(max_digits=5, decimal_places=1, required=False, write_only=True)
    calves = serializers.DecimalField(max_digits=5, decimal_places=1, required=False, write_only=True)
    
    # Make date optional with default to today
    date = serializers.DateField(required=False)
    
    class Meta:
        model = BodyMeasurement
        fields = [
            'date', 'weight', 'height', 'body_fat_percentage', 'muscle_mass',
            'chest', 'waist', 'hips', 
            'arms', 'arms_left', 'arms_right',
            'thighs', 'thighs_left', 'thighs_right',
            'calves', 'calves_left', 'calves_right',
            'neck', 'shoulders', 'notes', 'photo'
        ]
    
    def validate(self, data):
        """Handle simplified field names and set defaults"""
        from datetime import date as date_class
        
        # Set default date to today if not provided (only for CREATE, not UPDATE)
        if 'date' not in data or data['date'] is None:
            # If this is an update (instance exists), preserve the original date
            if self.instance:
                data['date'] = self.instance.date
            else:
                # For new measurements, default to today
                data['date'] = date_class.today()
        
        # Map simplified fields to left/right variants
        if 'arms' in data and data['arms']:
            if 'arms_left' not in data:
                data['arms_left'] = data['arms']
            if 'arms_right' not in data:
                data['arms_right'] = data['arms']
            del data['arms']
        
        if 'thighs' in data and data['thighs']:
            if 'thighs_left' not in data:
                data['thighs_left'] = data['thighs']
            if 'thighs_right' not in data:
                data['thighs_right'] = data['thighs']
            del data['thighs']
        
        if 'calves' in data and data['calves']:
            if 'calves_left' not in data:
                data['calves_left'] = data['calves']
            if 'calves_right' not in data:
                data['calves_right'] = data['calves']
            del data['calves']
        
        return data
    
    def validate_date(self, value):
        """Ensure no duplicate measurements for the same date"""
        user = self.context['request'].user
        # Skip validation if this is an update
        instance = self.instance if hasattr(self, 'instance') else None
        
        if instance:
            # If updating and date hasn't changed, allow it
            if instance.date == value:
                return value
            # If date changed, check for duplicates excluding current instance
            if BodyMeasurement.objects.filter(user=user, date=value).exclude(id=instance.id).exists():
                raise serializers.ValidationError(
                    "この日付の測定値は既に存在します。既存のものを更新してください。"
                )
        else:
            # Creating new, check for any duplicates
            if BodyMeasurement.objects.filter(user=user, date=value).exists():
                raise serializers.ValidationError(
                    "この日付の測定値は既に存在します。既存のものを更新してください。"
                )
        
        return value


class BodyMeasurementListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing measurements"""
    bmi = serializers.ReadOnlyField()
    weight_change = serializers.ReadOnlyField()
    
    class Meta:
        model = BodyMeasurement
        fields = [
            'id', 'date', 'weight', 'height', 'body_fat_percentage', 'bmi',
            'weight_change', 'waist', 'chest', 'hips', 'created_at'
        ]


class ProgressLogSerializer(serializers.ModelSerializer):
    """Serializer for ProgressLog model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = ProgressLog
        fields = [
            'id', 'user', 'user_name', 'date', 'energy_level', 'mood',
            'sleep_quality', 'sleep_hours', 'soreness_level', 'stress_level',
            'notes', 'achievements', 'challenges', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class ProgressLogCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ProgressLog"""
    
    class Meta:
        model = ProgressLog
        fields = [
            'date', 'energy_level', 'mood', 'sleep_quality', 'sleep_hours',
            'soreness_level', 'stress_level', 'notes', 'achievements', 'challenges'
        ]
    
    def validate_date(self, value):
        """Ensure no duplicate logs for the same date"""
        user = self.context['request'].user
        if ProgressLog.objects.filter(user=user, date=value).exists():
            raise serializers.ValidationError(
                "この日付の進捗記録は既に存在します。既存のものを更新してください。"
            )
        return value


class MeasurementHistorySerializer(serializers.Serializer):
    """Serializer for measurement history data"""
    dates = serializers.ListField(child=serializers.DateField())
    weights = serializers.ListField(child=serializers.DecimalField(max_digits=5, decimal_places=2))
    body_fat_percentages = serializers.ListField(
        child=serializers.DecimalField(max_digits=4, decimal_places=1, allow_null=True)
    )
    bmis = serializers.ListField(child=serializers.FloatField(allow_null=True))


class ProgressSummarySerializer(serializers.Serializer):
    """Serializer for progress summary statistics"""
    total_measurements = serializers.IntegerField()
    total_progress_logs = serializers.IntegerField()
    starting_weight = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    current_weight = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    total_weight_change = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    starting_body_fat = serializers.DecimalField(max_digits=4, decimal_places=1, allow_null=True)
    current_body_fat = serializers.DecimalField(max_digits=4, decimal_places=1, allow_null=True)
    body_fat_change = serializers.DecimalField(max_digits=4, decimal_places=1, allow_null=True)
    average_energy_level = serializers.FloatField(allow_null=True)
    average_sleep_hours = serializers.FloatField(allow_null=True)
