# Generated migration for UserPreferences model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_foodpreference_options_alter_user_options_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserPreferences',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email_notifications', models.BooleanField(default=True, verbose_name='メール通知')),
                ('workout_reminders', models.BooleanField(default=True, verbose_name='ワークアウトリマインダー')),
                ('meal_reminders', models.BooleanField(default=True, verbose_name='食事リマインダー')),
                ('progress_updates', models.BooleanField(default=True, verbose_name='進捗更新')),
                ('weekly_summary', models.BooleanField(default=True, verbose_name='週間サマリー')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='preferences', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'ユーザー設定',
                'verbose_name_plural': 'ユーザー設定',
            },
        ),
    ]
