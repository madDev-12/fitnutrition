from django.contrib import admin
from .models import (
    Exercise, ExerciseMedia, WorkoutPlan, WorkoutPlanDay, WorkoutPlanExercise,
    Workout, WorkoutExercise, WorkoutSchedule, FavoriteExercise
)


class ExerciseMediaInline(admin.TabularInline):
    model = ExerciseMedia
    extra = 1
    fields = ['media_type', 'file', 'url', 'order', 'caption']


class WorkoutPlanExerciseInline(admin.TabularInline):
    model = WorkoutPlanExercise
    extra = 1
    autocomplete_fields = ['exercise']


class WorkoutPlanDayInline(admin.TabularInline):
    model = WorkoutPlanDay
    extra = 1
    show_change_link = True


class WorkoutExerciseInline(admin.TabularInline):
    model = WorkoutExercise
    extra = 1
    autocomplete_fields = ['exercise']


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ['name', 'exercise_type', 'difficulty', 'equipment', 'calories_per_minute', 'is_custom', 'created_at']
    list_filter = ['exercise_type', 'difficulty', 'equipment', 'is_custom']
    search_fields = ['name', 'description', 'primary_muscles', 'secondary_muscles']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ExerciseMediaInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'exercise_type', 'difficulty', 'equipment')
        }),
        ('Muscle Groups', {
            'fields': ('primary_muscles', 'secondary_muscles')
        }),
        ('Instructions', {
            'fields': ('instructions', 'tips')
        }),
        ('Metrics', {
            'fields': ('calories_per_minute',)
        }),
        ('Media', {
            'fields': ('video_url', 'image_url', 'image')
        }),
        ('Metadata', {
            'fields': ('is_custom', 'created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(WorkoutPlan)
class WorkoutPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'goal', 'difficulty', 'duration_weeks', 'days_per_week', 'is_custom', 'created_at']
    list_filter = ['goal', 'difficulty', 'is_custom']
    search_fields = ['name', 'description', 'overview']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [WorkoutPlanDayInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'goal', 'difficulty')
        }),
        ('Duration', {
            'fields': ('duration_weeks', 'days_per_week')
        }),
        ('Details', {
            'fields': ('overview', 'requirements')
        }),
        ('Metadata', {
            'fields': ('is_custom', 'created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(WorkoutPlanDay)
class WorkoutPlanDayAdmin(admin.ModelAdmin):
    list_display = ['workout_plan', 'day_number', 'name', 'rest_day']
    list_filter = ['rest_day', 'workout_plan']
    search_fields = ['name', 'description']
    inlines = [WorkoutPlanExerciseInline]


@admin.register(WorkoutPlanExercise)
class WorkoutPlanExerciseAdmin(admin.ModelAdmin):
    list_display = ['plan_day', 'exercise', 'order', 'sets', 'reps', 'duration_seconds']
    list_filter = ['plan_day__workout_plan']
    autocomplete_fields = ['exercise']


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'date', 'duration_minutes', 'total_calories_burned', 'completed', 'created_at']
    list_filter = ['completed', 'date', 'workout_plan']
    search_fields = ['name', 'notes', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [WorkoutExerciseInline]
    date_hierarchy = 'date'
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'workout_plan', 'name', 'date')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'duration_minutes')
        }),
        ('Metrics', {
            'fields': ('total_calories_burned',)
        }),
        ('Status', {
            'fields': ('completed', 'notes')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(WorkoutExercise)
class WorkoutExerciseAdmin(admin.ModelAdmin):
    list_display = ['workout', 'exercise', 'order', 'planned_sets', 'completed_sets', 'completed']
    list_filter = ['completed', 'workout__date']
    autocomplete_fields = ['exercise']


@admin.register(WorkoutSchedule)
class WorkoutScheduleAdmin(admin.ModelAdmin):
    list_display = ['user', 'workout_plan', 'start_date', 'end_date', 'is_active', 'completed']
    list_filter = ['is_active', 'completed', 'start_date']
    search_fields = ['user__email', 'workout_plan__name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'start_date'


@admin.register(FavoriteExercise)
class FavoriteExerciseAdmin(admin.ModelAdmin):
    list_display = ['user', 'exercise', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'exercise__name']
    autocomplete_fields = ['exercise']


@admin.register(ExerciseMedia)
class ExerciseMediaAdmin(admin.ModelAdmin):
    list_display = ['exercise', 'media_type', 'order', 'caption', 'created_at']
    list_filter = ['media_type', 'created_at']
    search_fields = ['exercise__name', 'caption']
    autocomplete_fields = ['exercise']
    ordering = ['exercise', 'order']
