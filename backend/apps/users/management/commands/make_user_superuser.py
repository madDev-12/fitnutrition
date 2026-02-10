from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Make an existing user a superuser with staff privileges'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to make superuser')

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email)
            
            # Set all required flags
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.save()
            
            self.stdout.write(self.style.SUCCESS('=' * 60))
            self.stdout.write(self.style.SUCCESS(f'User {email} is now a superuser!'))
            self.stdout.write(self.style.SUCCESS('=' * 60))
            self.stdout.write(self.style.SUCCESS(f'Email: {user.email}'))
            self.stdout.write(self.style.SUCCESS(f'Username: {user.username}'))
            self.stdout.write(self.style.SUCCESS(f'is_staff: {user.is_staff}'))
            self.stdout.write(self.style.SUCCESS(f'is_superuser: {user.is_superuser}'))
            self.stdout.write(self.style.SUCCESS(f'is_active: {user.is_active}'))
            self.stdout.write(self.style.SUCCESS('=' * 60))
            self.stdout.write(self.style.WARNING('User can now login to /admin/'))
            self.stdout.write(self.style.SUCCESS('=' * 60))
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with email {email} does not exist'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
