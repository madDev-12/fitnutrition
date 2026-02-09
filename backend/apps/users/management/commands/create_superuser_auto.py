"""
Management command to create superuser automatically
Usage: python manage.py create_superuser_auto
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a superuser automatically using environment variables'

    def handle(self, *args, **options):
        # Get credentials from environment variables or use defaults
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@fitnutrition.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123456')
        
        # Check if superuser already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'Superuser "{username}" already exists.')
            )
            return
        
        # Create superuser
        try:
            from datetime import date
            superuser = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                first_name='Admin',
                last_name='User',
                date_of_birth=date(1990, 1, 1)  # Default date of birth
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Superuser "{username}" created successfully!')
            )
            self.stdout.write(
                self.style.SUCCESS(f'Email: {email}')
            )
            self.stdout.write(
                self.style.SUCCESS('Password: (set via environment variable or default)')
            )
            self.stdout.write(
                self.style.WARNING('Please change the password after first login!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating superuser: {str(e)}')
            )
