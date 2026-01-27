from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Exercise(models.Model):
    """Exercise database with details"""
    EXERCISE_TYPES = [
        ('strength', '筋力トレーニング'),
        ('cardio', '有酸素運動'),
        ('flexibility', '柔軟性'),
        ('balance', 'バランス'),
        ('sports', 'スポーツ'),
    ]

    DIFFICULTY_LEVELS = [
        ('beginner', '初級'),
        ('intermediate', '中級'),
        ('advanced', '上級'),
    ]

    EQUIPMENT_CHOICES = [
        ('none', '器具なし'),
        ('dumbbells', 'ダンベル'),
        ('barbell', 'バーベル'),
        ('machine', 'マシン'),
        ('bodyweight', '自重'),
        ('resistance_band', 'レジスタンスバンド'),
        ('kettlebell', 'ケトルベル'),
        ('other', 'その他'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField()
    exercise_type = models.CharField(max_length=20, choices=EXERCISE_TYPES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_LEVELS)
    equipment = models.CharField(max_length=50, choices=EQUIPMENT_CHOICES)
    
    # Target muscle groups
    primary_muscles = models.JSONField(default=list, help_text="List of primary muscle groups")
    secondary_muscles = models.JSONField(default=list, help_text="List of secondary muscle groups")
    
    # Instructions
    instructions = models.TextField(blank=True, help_text="Step-by-step instructions")
    tips = models.TextField(blank=True, help_text="Tips and common mistakes")
    
    # Metrics
    calories_per_minute = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Estimated calories burned per minute"
    )
    met_value = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        default=5.0,
        help_text="Metabolic Equivalent of Task (MET) - energy cost of activity",
        verbose_name="MET値"
    )
    
    # Media
    video_url = models.URLField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    image = models.ImageField(upload_to='exercises/', blank=True, null=True)
    
    # Metadata
    is_custom = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_exercises'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['exercise_type']),
            models.Index(fields=['difficulty']),
            models.Index(fields=['equipment']),
        ]

    def __str__(self):
        return self.name


class ExerciseMedia(models.Model):
    """Media files (images/videos) for exercises"""
    MEDIA_TYPES = [
        ('image', '画像'),
        ('video', '動画'),
    ]
    
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.CASCADE,
        related_name='media_files'
    )
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES)
    file = models.FileField(
        upload_to='exercises/media/',
        help_text="Image or video file"
    )
    url = models.URLField(blank=True, null=True, help_text="External URL (optional)")
    order = models.IntegerField(default=0, help_text="Display order")
    caption = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['exercise', 'order', 'created_at']
        verbose_name_plural = 'Exercise Media'

    def __str__(self):
        return f"{self.exercise.name} - {self.media_type} #{self.order}"


class WorkoutPlan(models.Model):
    """Pre-defined workout plans"""
    GOAL_CHOICES = [
        ('weight_loss', '減量'),
        ('muscle_gain', '筋肉増強'),
        ('strength', '筋力向上'),
        ('endurance', '持久力'),
        ('general_fitness', '総合的なフィットネス'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField()
    goal = models.CharField(max_length=50, choices=GOAL_CHOICES)
    difficulty = models.CharField(max_length=20, choices=Exercise.DIFFICULTY_LEVELS)
    
    # Duration
    duration_weeks = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(52)]
    )
    days_per_week = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(7)]
    )
    
    # Details
    overview = models.TextField(help_text="Overview of the plan")
    requirements = models.TextField(help_text="Equipment and prerequisites")
    
    # Metadata
    is_custom = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_workout_plans'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class WorkoutPlanDay(models.Model):
    """Individual day in a workout plan"""
    workout_plan = models.ForeignKey(
        WorkoutPlan,
        on_delete=models.CASCADE,
        related_name='plan_days'
    )
    day_number = models.IntegerField(
        validators=[MinValueValidator(1)]
    )
    name = models.CharField(max_length=200, help_text="e.g., 'Upper Body Day'")
    description = models.TextField(blank=True)
    rest_day = models.BooleanField(default=False)

    class Meta:
        ordering = ['workout_plan', 'day_number']
        unique_together = ['workout_plan', 'day_number']

    def __str__(self):
        return f"{self.workout_plan.name} - Day {self.day_number}"


class WorkoutPlanExercise(models.Model):
    """Exercises in a workout plan day"""
    plan_day = models.ForeignKey(
        WorkoutPlanDay,
        on_delete=models.CASCADE,
        related_name='exercises'
    )
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    order = models.IntegerField(default=0)
    
    # Sets and reps
    sets = models.IntegerField(validators=[MinValueValidator(1)])
    reps = models.IntegerField(
        validators=[MinValueValidator(1)],
        null=True,
        blank=True,
        help_text="Number of reps (leave blank for time-based)"
    )
    duration_seconds = models.IntegerField(
        null=True,
        blank=True,
        help_text="Duration in seconds (for time-based exercises)"
    )
    rest_seconds = models.IntegerField(
        default=60,
        help_text="Rest time between sets in seconds"
    )
    
    # Optional
    weight_kg = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Recommended weight in kg"
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['plan_day', 'order']

    def __str__(self):
        return f"{self.exercise.name} - {self.sets}x{self.reps or f'{self.duration_seconds}s'}"


class Workout(models.Model):
    """User's workout log"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='workouts'
    )
    workout_plan = models.ForeignKey(
        WorkoutPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workout_logs'
    )
    
    name = models.CharField(max_length=200)
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    
    # Calculated fields
    duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total workout duration in minutes"
    )
    total_calories_burned = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    
    # Progress tracking
    progress_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Workout completion percentage (0-100)"
    )
    exercise_checks = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON object storing exercise check states"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'completed']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.name} ({self.date})"

    def calculate_duration(self):
        """Calculate workout duration from start and end time"""
        if self.start_time and self.end_time:
            from datetime import datetime, timedelta
            start = datetime.combine(self.date, self.start_time)
            end = datetime.combine(self.date, self.end_time)
            if end < start:
                end += timedelta(days=1)
            duration = (end - start).total_seconds() / 60
            self.duration_minutes = int(duration)
            return self.duration_minutes
        return None


class WorkoutExercise(models.Model):
    """Individual exercise in a workout log"""
    workout = models.ForeignKey(
        Workout,
        on_delete=models.CASCADE,
        related_name='exercises'
    )
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    order = models.IntegerField(default=0)
    
    # Planned
    planned_sets = models.IntegerField(validators=[MinValueValidator(1)])
    planned_reps = models.IntegerField(
        validators=[MinValueValidator(1)],
        null=True,
        blank=True
    )
    planned_duration_seconds = models.IntegerField(null=True, blank=True)
    planned_weight_kg = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Actual (what was performed)
    completed_sets = models.IntegerField(default=0)
    actual_reps = models.JSONField(
        default=list,
        help_text="List of actual reps per set"
    )
    actual_weight_kg = models.JSONField(
        default=list,
        help_text="List of actual weights per set"
    )
    
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=False)

    class Meta:
        ordering = ['workout', 'order']

    def __str__(self):
        return f"{self.exercise.name} in {self.workout.name}"


class WorkoutSchedule(models.Model):
    """User's workout schedule/calendar"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='workout_schedules'
    )
    workout_plan = models.ForeignKey(
        WorkoutPlan,
        on_delete=models.CASCADE,
        related_name='schedules'
    )
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    completed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.workout_plan.name}"


class FavoriteExercise(models.Model):
    """User's favorite exercises"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorite_exercises'
    )
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'exercise']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.exercise.name}"
