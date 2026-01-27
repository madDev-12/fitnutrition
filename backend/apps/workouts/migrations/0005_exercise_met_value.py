# Generated migration for adding MET value to Exercise model

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0004_alter_exercise_exercise_type_exercisemedia'),
    ]

    operations = [
        migrations.AddField(
            model_name='exercise',
            name='met_value',
            field=models.DecimalField(
                blank=True,
                decimal_places=1,
                default=5.0,
                help_text='Metabolic Equivalent of Task (MET) - energy cost of activity',
                max_digits=4,
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
                verbose_name='MET値'
            ),
        ),
    ]
