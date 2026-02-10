from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    verbose_name = 'ユーザー管理'

    def ready(self):
        # Import signals
        import apps.users.signals
        
        # Auto-create superuser on startup
        from django.contrib.auth import get_user_model
        from datetime import date
        import os
        
        User = get_user_model()
        
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@fitnutrition.com')
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123456')
        
        try:
            if not User.objects.filter(email=email).exists():
                user = User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password,
                    first_name='Admin',
                    last_name='User',
                    date_of_birth=date(1990, 1, 1)
                )
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                user.save()
                print(f'✓ Superuser created: {email}')
            else:
                # Update existing user to ensure staff privileges
                user = User.objects.get(email=email)
                if not user.is_staff or not user.is_superuser:
                    user.is_staff = True
                    user.is_superuser = True
                    user.is_active = True
                    user.save()
                    print(f'✓ Updated user {email} to superuser with staff privileges')
                else:
                    print(f'✓ Superuser {email} already exists')
        except Exception as e:
            print(f'✗ Error creating/updating superuser: {str(e)}')
