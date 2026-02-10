from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from datetime import date
import os
import traceback

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a superuser automatically'

    def handle(self, *args, **options):
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@fitnutrition.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123456')
        
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            if user.is_superuser:
                self.stdout.write(self.style.SUCCESS(f'Superuser {email} already exists'))
            else:
                self.stdout.write(self.style.WARNING(f'User {email} exists but not superuser'))
            return
        
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'Username {username} already exists'))
            return
        
        try:
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                first_name='Admin',
                last_name='User',
                date_of_birth=date(1990, 1, 1)
            )
            
            # Explicitly set staff and superuser flags
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.save()
            
            self.stdout.write(self.style.SUCCESS('=' * 60))
            self.stdout.write(self.style.SUCCESS('Superuser created successfully!'))
            self.stdout.write(self.style.SUCCESS('=' * 60))
            self.stdout.write(self.style.SUCCESS(f'Email: {email}'))
            self.stdout.write(self.style.SUCCESS(f'Username: {username}'))
            self.stdout.write(self.style.SUCCESS(f'is_staff: {user.is_staff}'))
            self.stdout.write(self.style.SUCCESS(f'is_superuser: {user.is_superuser}'))
            self.stdout.write(self.style.SUCCESS(f'is_active: {user.is_active}'))
            self.stdout.write(self.style.SUCCESS('=' * 60))
            self.stdout.write(self.style.WARNING('Please change password after first login'))
            self.stdout.write(self.style.WARNING('Login at: /admin/'))
            self.stdout.write(self.style.SUCCESS('=' * 60))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR('=' * 60))
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            self.stdout.write(self.style.ERROR('=' * 60))
            self.stdout.write(self.style.ERROR(traceback.format_exc()))
