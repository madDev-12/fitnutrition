"""
Signals for Users app
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import User, UserProfile, FoodPreference


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Create UserProfile and FoodPreference when a new user is created
    """
    if created:
        # Create empty profile (will be filled during onboarding)
        # UserProfile.objects.create(user=instance)
        # Create empty food preferences
        # FoodPreference.objects.create(user=instance)
        pass  # Let user create profile manually during onboarding


@receiver(post_save, sender=UserProfile)
def create_initial_measurement(sender, instance, created, **kwargs):
    """
    Create an initial BodyMeasurement record when UserProfile is created with height and weight
    """
    if created and instance.height and instance.current_weight:
        # Import here to avoid circular imports
        from apps.measurements.models import BodyMeasurement
        
        # Check if user already has measurements
        existing_measurements = BodyMeasurement.objects.filter(user=instance.user).exists()
        
        if not existing_measurements:
            # Create initial measurement with registration data
            BodyMeasurement.objects.create(
                user=instance.user,
                date=timezone.now().date(),
                weight=instance.current_weight,
                height=instance.height,
                body_fat_percentage=instance.body_fat_percentage if instance.body_fat_percentage else None,
                chest=instance.chest if instance.chest else None,
                waist=instance.waist if instance.waist else None,
                hips=instance.hips if instance.hips else None,
                arms_left=instance.arms if instance.arms else None,
                arms_right=instance.arms if instance.arms else None,
                thighs_left=instance.thighs if instance.thighs else None,
                thighs_right=instance.thighs if instance.thighs else None,
                calves_left=instance.calves if instance.calves else None,
                calves_right=instance.calves if instance.calves else None,
            )
