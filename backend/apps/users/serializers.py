"""
Serializers for User models
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, UserProfile, FoodPreference, UserPreferences


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'date_of_birth', 'age', 'profile_picture',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'username', 'created_at', 'updated_at']
        extra_kwargs = {
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    # Profile fields
    gender = serializers.CharField(required=False, write_only=True)
    height = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, write_only=True)
    weight = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, write_only=True)
    activity_level = serializers.CharField(required=False, write_only=True)
    fitness_goal = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'date_of_birth',
            'gender', 'height', 'weight', 'activity_level', 'fitness_goal'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "パスワードが一致しません。"}
            )
        
        # Generate username from email if not provided
        if not attrs.get('username'):
            email = attrs.get('email', '')
            username = email.split('@')[0]
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            attrs['username'] = username
        
        return attrs
    
    def create(self, validated_data):
        # Extract profile fields
        profile_data = {
            'gender': validated_data.pop('gender', None),
            'height': validated_data.pop('height', None),
            'current_weight': validated_data.pop('weight', None),
            'activity_level': validated_data.pop('activity_level', None),
            'fitness_goal': validated_data.pop('fitness_goal', None),
        }
        
        # Remove password2 and create user
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        
        # Create user profile if profile data is provided
        if any(profile_data.values()):
            UserProfile.objects.create(user=user, **{k: v for k, v in profile_data.items() if v is not None})
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model"""
    user = UserSerializer(read_only=True)
    bmi = serializers.ReadOnlyField()
    bmr = serializers.ReadOnlyField()
    tdee = serializers.ReadOnlyField()
    daily_calorie_target = serializers.ReadOnlyField()
    macro_targets = serializers.ReadOnlyField()
    
    # Make required fields optional for partial updates
    gender = serializers.CharField(required=False, allow_blank=True)
    height = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    current_weight = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'gender', 'height', 'current_weight', 'target_weight',
            'activity_level', 'fitness_goal', 'body_fat_percentage', 'target_body_fat_percentage',
            'chest', 'waist', 'hips', 'arms', 'thighs', 'calves',
            'bmi', 'bmr', 'tdee', 'daily_calorie_target', 'macro_targets',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class UserProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating UserProfile"""
    
    class Meta:
        model = UserProfile
        fields = [
            'gender', 'height', 'current_weight', 'target_weight',
            'activity_level', 'fitness_goal', 'body_fat_percentage', 'target_body_fat_percentage',
            'chest', 'waist', 'hips', 'arms', 'thighs', 'calves'
        ]


class FoodPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for FoodPreference model"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = FoodPreference
        fields = [
            'id', 'user', 'diet_type', 'allergies', 'dislikes',
            'preferred_foods', 'avoid_ingredients',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for User with profile and preferences"""
    profile = UserProfileSerializer(read_only=True)
    food_preferences = FoodPreferenceSerializer(read_only=True)
    age = serializers.ReadOnlyField()
    total_measurements = serializers.SerializerMethodField()
    total_meals = serializers.SerializerMethodField()
    total_workouts = serializers.SerializerMethodField()
    days_active = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'date_of_birth', 'age', 'profile_picture',
            'profile', 'food_preferences',
            'total_measurements', 'total_meals', 'total_workouts', 'days_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_total_measurements(self, obj):
        """Get total number of measurements"""
        from apps.measurements.models import BodyMeasurement
        return BodyMeasurement.objects.filter(user=obj).count()
    
    def get_total_meals(self, obj):
        """Get total number of meals logged"""
        from apps.nutrition.models import Meal
        return Meal.objects.filter(user=obj).count()
    
    def get_total_workouts(self, obj):
        """Get total number of completed workouts"""
        from apps.workouts.models import Workout
        return Workout.objects.filter(user=obj, completed=True).count()
    
    def get_days_active(self, obj):
        """Get number of unique days user has been active"""
        from django.db.models import Q
        from apps.measurements.models import BodyMeasurement
        from apps.nutrition.models import Meal
        from apps.workouts.models import Workout
        from datetime import datetime
        
        # Get unique dates from measurements
        measurement_dates = set(BodyMeasurement.objects.filter(user=obj).values_list('date', flat=True))
        
        # Get unique dates from meals
        meal_dates = set(Meal.objects.filter(user=obj).values_list('date', flat=True))
        
        # Get unique dates from workouts
        workout_dates = set(Workout.objects.filter(user=obj).values_list('date', flat=True))
        
        # Combine all unique dates
        all_dates = measurement_dates.union(meal_dates).union(workout_dates)
        
        return len(all_dates)


class UserPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for UserPreferences model"""
    
    class Meta:
        model = UserPreferences
        fields = [
            'email_notifications',
            'workout_reminders',
            'meal_reminders',
            'progress_updates',
            'weekly_summary',
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError(
                {"new_password": "パスワードが一致しません。"}
            )
        return attrs
