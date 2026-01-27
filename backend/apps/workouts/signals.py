from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Workout, WorkoutExercise


@receiver(pre_save, sender=Workout)
def calculate_workout_duration(sender, instance, **kwargs):
    """Calculate workout duration before saving"""
    if instance.start_time and instance.end_time and not instance.duration_minutes:
        instance.calculate_duration()


@receiver(post_save, sender=WorkoutExercise)
def update_workout_calories(sender, instance, **kwargs):
    """Update total calories burned when workout exercise is saved"""
    workout = instance.workout
    
    # Calculate calories for this exercise
    if instance.completed and instance.exercise.calories_per_minute:
        # Estimate based on sets and reps or duration
        if instance.planned_duration_seconds:
            duration_minutes = instance.planned_duration_seconds / 60
        else:
            # Estimate 3 seconds per rep
            duration_minutes = (instance.completed_sets * (instance.planned_reps or 10) * 3) / 60
        
        exercise_calories = float(instance.exercise.calories_per_minute) * duration_minutes
        
        # Update workout total
        total_calories = sum(
            float(ex.exercise.calories_per_minute or 0) * (
                (ex.planned_duration_seconds or (ex.completed_sets * (ex.planned_reps or 10) * 3)) / 60
            )
            for ex in workout.exercises.filter(completed=True)
        )
        
        workout.total_calories_burned = total_calories
        workout.save(update_fields=['total_calories_burned'])
