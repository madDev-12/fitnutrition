"""
Analytics service for calculating BMR, TDEE, and other metrics
"""
from datetime import datetime, timedelta
from django.db import models
from django.db.models import Avg, Sum, Count
from django.utils import timezone
from apps.measurements.models import BodyMeasurement
from apps.nutrition.models import Meal
from apps.workouts.models import Workout


class MetabolismCalculator:
    """Calculate BMR and TDEE"""
    
    # Activity level multipliers
    ACTIVITY_MULTIPLIERS = {
        'sedentary': 1.2,        # Little or no exercise
        'light': 1.375,          # Light exercise 1-3 days/week
        'moderate': 1.55,        # Moderate exercise 3-5 days/week
        'active': 1.725,         # Hard exercise 6-7 days/week
        'very_active': 1.9       # Very hard exercise & physical job
    }
    
    @staticmethod
    def calculate_bmr(weight_kg, height_cm, age, gender):
        """
        Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
        
        Args:
            weight_kg: Weight in kilograms
            height_cm: Height in centimeters
            age: Age in years
            gender: 'male' or 'female'
        
        Returns:
            BMR in calories/day
        """
        if gender.lower() == 'male':
            bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
        else:  # female
            bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
        
        return round(bmr, 2)
    
    @classmethod
    def calculate_tdee(cls, bmr, activity_level):
        """
        Calculate Total Daily Energy Expenditure
        
        Args:
            bmr: Basal Metabolic Rate
            activity_level: Activity level key from ACTIVITY_MULTIPLIERS
        
        Returns:
            TDEE in calories/day
        """
        multiplier = cls.ACTIVITY_MULTIPLIERS.get(activity_level, 1.2)
        tdee = bmr * multiplier
        return round(tdee, 2)
    
    @classmethod
    def calculate_for_user(cls, user):
        """
        Calculate BMR and TDEE for a user
        
        Args:
            user: User object
        
        Returns:
            dict with bmr, tdee, and other metrics
        """
        try:
            profile = user.profile
            latest_measurement = BodyMeasurement.objects.filter(
                user=user
            ).order_by('-date').first()
            
            if not latest_measurement:
                return None
            
            # Calculate BMR
            # Get age from user, not profile
            age = user.age if user.age else 30  # Default to 30 if age not available
            
            bmr = cls.calculate_bmr(
                weight_kg=float(latest_measurement.weight),
                height_cm=float(latest_measurement.height),
                age=age,
                gender=profile.gender
            )
            
            # Calculate TDEE
            tdee = cls.calculate_tdee(bmr, profile.activity_level)
            
            # Calculate BMI
            height_m = float(latest_measurement.height) / 100
            bmi = float(latest_measurement.weight) / (height_m ** 2)
            
            # Determine BMI category
            if bmi < 18.5:
                bmi_category = 'underweight'
            elif 18.5 <= bmi < 25:
                bmi_category = 'normal'
            elif 25 <= bmi < 30:
                bmi_category = 'overweight'
            else:
                bmi_category = 'obese'
            
            return {
                'bmr': bmr,
                'tdee': tdee,
                'bmi': round(bmi, 2),
                'bmi_category': bmi_category,
                'weight': float(latest_measurement.weight),
                'height': float(latest_measurement.height),
                'age': age,
                'gender': profile.gender,
                'activity_level': profile.activity_level
            }
        
        except Exception as e:
            return None


class MacroCalculator:
    """Calculate macro distribution based on goals"""
    
    # Macro ratios for different goals (protein, carbs, fats)
    MACRO_RATIOS = {
        'weight_loss': (0.30, 0.40, 0.30),      # Higher protein, moderate carbs
        'muscle_gain': (0.30, 0.40, 0.30),      # High protein, high carbs
        'maintenance': (0.25, 0.45, 0.30),      # Balanced
        'endurance': (0.20, 0.55, 0.25),        # High carbs for energy
        'keto': (0.25, 0.05, 0.70),             # Very low carb, high fat
    }
    
    @classmethod
    def calculate_macros(cls, tdee, goal, calorie_adjustment=0):
        """
        Calculate macro distribution
        
        Args:
            tdee: Total Daily Energy Expenditure
            goal: Fitness goal
            calorie_adjustment: Calorie surplus/deficit
        
        Returns:
            dict with macro targets in grams
        """
        target_calories = tdee + calorie_adjustment
        
        # Get macro ratios
        ratios = cls.MACRO_RATIOS.get(goal, cls.MACRO_RATIOS['maintenance'])
        protein_ratio, carb_ratio, fat_ratio = ratios
        
        # Calculate grams (protein: 4 cal/g, carbs: 4 cal/g, fats: 9 cal/g)
        protein_grams = (target_calories * protein_ratio) / 4
        carb_grams = (target_calories * carb_ratio) / 4
        fat_grams = (target_calories * fat_ratio) / 9
        
        return {
            'target_calories': round(target_calories, 0),
            'protein_grams': round(protein_grams, 1),
            'carb_grams': round(carb_grams, 1),
            'fat_grams': round(fat_grams, 1),
            'protein_calories': round(protein_grams * 4, 0),
            'carb_calories': round(carb_grams * 4, 0),
            'fat_calories': round(fat_grams * 9, 0),
        }
    
    @classmethod
    def get_calorie_adjustment(cls, goal):
        """Get recommended calorie adjustment for goal"""
        adjustments = {
            'weight_loss': -500,      # 500 calorie deficit
            'muscle_gain': 300,       # 300 calorie surplus
            'maintenance': 0,
            'endurance': 200,
        }
        return adjustments.get(goal, 0)


class ProgressAnalyzer:
    """Analyze user progress over time"""
    
    @staticmethod
    def get_weight_progress_by_date(user, start_date, end_date):
        """Get weight progress for specific date range"""
        measurements = BodyMeasurement.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date').values('date', 'weight')
        
        if not measurements:
            return None
        
        data_list = list(measurements)
        first_weight = float(data_list[0]['weight'])
        last_weight = float(data_list[-1]['weight'])
        weight_change = last_weight - first_weight
        
        # Create dict of existing measurements
        data_dict = {m['date']: float(m['weight']) for m in data_list}
        
        # Fill all dates in range
        filled_data = []
        current = start_date
        while current <= end_date:
            filled_data.append({
                'date': current,
                'weight': data_dict.get(current)
            })
            current += timedelta(days=1)
        
        return {
            'data': filled_data,
            'start_weight': first_weight,
            'current_weight': last_weight,
            'weight_change': round(weight_change, 2),
            'percentage_change': round((weight_change / first_weight) * 100, 2) if first_weight > 0 else 0,
        }
    
    @staticmethod
    def get_weight_progress(user, days=30):
        """Get weight progress over specified days"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        measurements = BodyMeasurement.objects.filter(
            user=user,
            date__gte=start_date
        ).order_by('date').values('date', 'weight')
        
        if not measurements:
            return None
        
        data_list = list(measurements)
        first_weight = float(data_list[0]['weight'])
        last_weight = float(data_list[-1]['weight'])
        weight_change = last_weight - first_weight
        
        # Create dict of existing measurements
        data_dict = {m['date']: float(m['weight']) for m in data_list}
        
        # Fill all dates between first and last
        filled_data = []
        current = data_list[0]['date']
        end = data_list[-1]['date']
        while current <= end:
            filled_data.append({
                'date': current,
                'weight': data_dict.get(current)
            })
            current += timedelta(days=1)
        
        return {
            'data': filled_data,
            'start_weight': first_weight,
            'current_weight': last_weight,
            'weight_change': round(weight_change, 2),
            'percentage_change': round((weight_change / first_weight) * 100, 2) if first_weight > 0 else 0,
            'days': days
        }
    
    @staticmethod
    def get_body_composition_progress_by_date(user, start_date, end_date):
        """Get body composition progress for specific date range"""
        measurements = BodyMeasurement.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')
        
        if not measurements:
            return None
        
        first = measurements.first()
        last = measurements.last()
        
        result = {
            'body_fat_change': None,
            'muscle_mass_change': None,
            'measurements': []
        }
        
        if first.body_fat_percentage and last.body_fat_percentage:
            result['body_fat_change'] = round(
                float(last.body_fat_percentage) - float(first.body_fat_percentage), 2
            )
            result['start_body_fat'] = float(first.body_fat_percentage)
            result['current_body_fat'] = float(last.body_fat_percentage)
        
        # Calculate estimated muscle mass (weight * (1 - body_fat_percentage))
        if first.body_fat_percentage and last.body_fat_percentage:
            first_muscle = float(first.weight) * (1 - float(first.body_fat_percentage) / 100)
            last_muscle = float(last.weight) * (1 - float(last.body_fat_percentage) / 100)
            result['muscle_mass_change'] = round(last_muscle - first_muscle, 2)
        
        # Create dict of existing measurements
        meas_dict = {}
        for m in measurements:
            meas_dict[m.date] = {
                'weight': float(m.weight),
                'body_fat_percentage': float(m.body_fat_percentage) if m.body_fat_percentage else None
            }
        
        # Fill all dates in range
        current = start_date
        while current <= end_date:
            if current in meas_dict:
                result['measurements'].append({
                    'date': current,
                    'weight': meas_dict[current]['weight'],
                    'body_fat_percentage': meas_dict[current]['body_fat_percentage']
                })
            else:
                result['measurements'].append({
                    'date': current,
                    'weight': None,
                    'body_fat_percentage': None
                })
            current += timedelta(days=1)
        
        return result
    
    @staticmethod
    def get_body_composition_progress(user, days=30):
        """Get body composition progress"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        measurements = BodyMeasurement.objects.filter(
            user=user,
            date__gte=start_date
        ).order_by('date')
        
        if not measurements:
            return None
        
        first = measurements.first()
        last = measurements.last()
        
        result = {
            'body_fat_change': None,
            'muscle_mass_change': None,
            'measurements': []
        }
        
        if first.body_fat_percentage and last.body_fat_percentage:
            result['body_fat_change'] = round(
                float(last.body_fat_percentage) - float(first.body_fat_percentage), 2
            )
            result['start_body_fat'] = float(first.body_fat_percentage)
            result['current_body_fat'] = float(last.body_fat_percentage)
        
        # Calculate estimated muscle mass (weight * (1 - body_fat_percentage))
        if first.body_fat_percentage and last.body_fat_percentage:
            first_muscle = float(first.weight) * (1 - float(first.body_fat_percentage) / 100)
            last_muscle = float(last.weight) * (1 - float(last.body_fat_percentage) / 100)
            result['muscle_mass_change'] = round(last_muscle - first_muscle, 2)
        
        # Create dict of existing measurements
        meas_dict = {}
        for m in measurements:
            meas_dict[m.date] = {
                'weight': float(m.weight),
                'body_fat_percentage': float(m.body_fat_percentage) if m.body_fat_percentage else None
            }
        
        # Fill all dates between first and last
        current = first.date
        end = last.date
        while current <= end:
            if current in meas_dict:
                result['measurements'].append({
                    'date': current,
                    'weight': meas_dict[current]['weight'],
                    'body_fat_percentage': meas_dict[current]['body_fat_percentage']
                })
            else:
                result['measurements'].append({
                    'date': current,
                    'weight': None,
                    'body_fat_percentage': None
                })
            current += timedelta(days=1)
        
        return result
    
    @staticmethod
    def get_nutrition_trends_by_date(user, start_date, end_date):
        """Get nutrition trends for specific date range"""
        # Get all meals in the date range
        meals = Meal.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=end_date
        )
        
        total_meals = meals.count()
        
        # Calculate totals from meal properties
        if total_meals > 0:
            total_calories = sum(meal.total_calories for meal in meals)
            total_protein = sum(meal.total_protein for meal in meals)
            total_carbs = sum(meal.total_carbs for meal in meals)
            total_fats = sum(meal.total_fats for meal in meals)
            
            avg_calories = total_calories / total_meals
            avg_protein = total_protein / total_meals
            avg_carbs = total_carbs / total_meals
            avg_fats = total_fats / total_meals
        else:
            avg_calories = avg_protein = avg_carbs = avg_fats = 0
        
        return {
            'average_daily_calories': round(avg_calories, 0),
            'average_daily_protein': round(avg_protein, 1),
            'average_daily_carbs': round(avg_carbs, 1),
            'average_daily_fats': round(avg_fats, 1),
            'total_meals_logged': total_meals,
        }
    
    @staticmethod
    def get_nutrition_trends(user, days=30):
        """Get nutrition trends"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        # Get all meals in the date range
        meals = Meal.objects.filter(
            user=user,
            date__gte=start_date
        )
        
        total_meals = meals.count()
        
        # Calculate totals from meal properties
        if total_meals > 0:
            total_calories = sum(meal.total_calories for meal in meals)
            total_protein = sum(meal.total_protein for meal in meals)
            total_carbs = sum(meal.total_carbs for meal in meals)
            total_fats = sum(meal.total_fats for meal in meals)
            
            avg_calories = total_calories / total_meals
            avg_protein = total_protein / total_meals
            avg_carbs = total_carbs / total_meals
            avg_fats = total_fats / total_meals
        else:
            avg_calories = avg_protein = avg_carbs = avg_fats = 0
        
        return {
            'average_daily_calories': round(avg_calories, 0),
            'average_daily_protein': round(avg_protein, 1),
            'average_daily_carbs': round(avg_carbs, 1),
            'average_daily_fats': round(avg_fats, 1),
            'total_meals_logged': total_meals,
            'days': days
        }
    
    @staticmethod
    def get_workout_trends_by_date(user, start_date, end_date):
        """Get workout trends for specific date range"""
        workouts = Workout.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=end_date
        ).aggregate(
            total_workouts=Count('id'),
            completed_workouts=Count('id', filter=models.Q(completed=True)),
            total_duration=Sum('duration_minutes'),
            total_calories=Sum('total_calories_burned'),
            avg_duration=Avg('duration_minutes')
        )
        
        # Calculate consistency based on unique workout days vs total days
        unique_workout_days = Workout.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=end_date
        ).values('date').distinct().count()
        
        days = (end_date - start_date).days + 1
        consistency_rate = round((unique_workout_days / days * 100), 1) if days > 0 else 0
        
        return {
            'total_workouts': workouts['total_workouts'],
            'completed_workouts': workouts['completed_workouts'],
            'completion_rate': consistency_rate,
            'total_duration_minutes': workouts['total_duration'] or 0,
            'total_calories_burned': round(workouts['total_calories'] or 0, 0),
            'average_duration_minutes': round(workouts['avg_duration'] or 0, 1),
        }
    
    @staticmethod
    def get_workout_trends(user, days=30):
        """Get workout trends"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        workouts = Workout.objects.filter(
            user=user,
            date__gte=start_date
        ).aggregate(
            total_workouts=Count('id'),
            completed_workouts=Count('id', filter=models.Q(completed=True)),
            total_duration=Sum('duration_minutes'),
            total_calories=Sum('total_calories_burned'),
            avg_duration=Avg('duration_minutes')
        )
        
        # Calculate consistency based on unique workout days vs total days
        unique_workout_days = Workout.objects.filter(
            user=user,
            date__gte=start_date
        ).values('date').distinct().count()
        
        consistency_rate = round((unique_workout_days / days * 100), 1) if days > 0 else 0
        
        return {
            'total_workouts': workouts['total_workouts'],
            'completed_workouts': workouts['completed_workouts'],
            'completion_rate': consistency_rate,
            'total_duration_minutes': workouts['total_duration'] or 0,
            'total_calories_burned': round(workouts['total_calories'] or 0, 0),
            'average_duration_minutes': round(workouts['avg_duration'] or 0, 1),
            'days': days
        }
    
    @staticmethod
    def get_exercise_type_distribution_by_date(user, start_date, end_date):
        """Get distribution of exercise types for specific date range"""
        from apps.workouts.models import WorkoutExercise
        
        # Get all workout exercises in the period
        workout_exercises = WorkoutExercise.objects.filter(
            workout__user=user,
            workout__date__gte=start_date,
            workout__date__lte=end_date
        ).select_related('exercise')
        
        # Count by exercise type
        type_counts = {}
        type_labels = {
            'strength': '筋力トレーニング',
            'cardio': '有酸素運動',
            'flexibility': '柔軟性',
            'balance': 'バランス',
            'sports': 'スポーツ',
        }
        
        for we in workout_exercises:
            exercise_type = we.exercise.exercise_type
            if exercise_type in type_counts:
                type_counts[exercise_type] += 1
            else:
                type_counts[exercise_type] = 1
        
        # Format for pie chart
        result = []
        for type_key, count in type_counts.items():
            result.append({
                'name': type_labels.get(type_key, type_key),
                'value': count,
                'type': type_key
            })
        
        return result
    
    @staticmethod
    def get_exercise_type_distribution(user, days=30):
        """Get distribution of exercise types"""
        from apps.workouts.models import WorkoutExercise
        start_date = timezone.now().date() - timedelta(days=days)
        
        # Get all workout exercises in the period (include both completed and in-progress)
        workout_exercises = WorkoutExercise.objects.filter(
            workout__user=user,
            workout__date__gte=start_date
        ).select_related('exercise')
        
        # Count by exercise type
        type_counts = {}
        type_labels = {
            'strength': '筋力トレーニング',
            'cardio': '有酸素運動',
            'flexibility': '柔軟性',
            'balance': 'バランス',
            'sports': 'スポーツ',
        }
        
        for we in workout_exercises:
            exercise_type = we.exercise.exercise_type
            if exercise_type in type_counts:
                type_counts[exercise_type] += 1
            else:
                type_counts[exercise_type] = 1
        
        # Format for pie chart
        result = []
        for type_key, count in type_counts.items():
            result.append({
                'name': type_labels.get(type_key, type_key),
                'value': count,
                'type': type_key
            })
        
        return result
    
    @classmethod
    def get_comprehensive_report_by_date(cls, user, start_date, end_date):
        """Get comprehensive progress report for specific date range"""
        # Get individual reports
        weight_progress = cls.get_weight_progress_by_date(user, start_date, end_date)
        body_composition = cls.get_body_composition_progress_by_date(user, start_date, end_date)
        nutrition_trends = cls.get_nutrition_trends_by_date(user, start_date, end_date)
        workout_trends = cls.get_workout_trends_by_date(user, start_date, end_date)
        
        # Format data for frontend compatibility
        result = {
            'weight_history': [],
            'body_fat_history': [],
            'workout_frequency': [],
            'calorie_trends': [],
            'weight_change': 0,
            'body_fat_change': 0,
            'total_workouts': 0,
            'workout_consistency': 0,
            'avg_calories': 0,
            'target_calories': 2000,
            'current_weight': 0,
            'weight_goal': 0,
            'current_body_fat': 0,
            'body_fat_goal': 0,
            'workout_goal': 0,
            'workouts_this_week': 0,
            'achievements': []
        }
        
        # Process weight data
        if weight_progress and weight_progress.get('data'):
            result['weight_history'] = [
                {'date': item['date'], 'weight': item['weight']} 
                for item in weight_progress['data']
            ]
            result['weight_change'] = weight_progress.get('weight_change', 0)
            result['current_weight'] = weight_progress.get('current_weight', 0)
        
        # Process body composition data
        if body_composition:
            if body_composition.get('measurements'):
                result['body_fat_history'] = [
                    {'date': item['date'], 'body_fat_percentage': item['body_fat_percentage']}
                    for item in body_composition['measurements']
                ]
            result['body_fat_change'] = body_composition.get('body_fat_change', 0)
            result['start_body_fat'] = body_composition.get('start_body_fat')
            result['current_body_fat'] = body_composition.get('current_body_fat')
        
        # Process nutrition data and workout calories
        from ..nutrition.models import Meal
        from ..workouts.models import Workout
        from django.db.models import Sum, F
        
        # Get daily calorie intake (摂取カロリー)
        daily_intake = {}
        if nutrition_trends:
            result['avg_calories'] = nutrition_trends.get('average_daily_calories', 0)
            
            meals_by_date = Meal.objects.filter(
                user=user,
                date__gte=start_date,
                date__lte=end_date
            ).values('date').annotate(
                total_calories=Sum(F('items__calories'))
            ).order_by('date')
            
            for item in meals_by_date:
                if item['total_calories']:
                    daily_intake[str(item['date'])] = round(item['total_calories'], 0)
        
        # Get daily calories burned (消費カロリー)
        daily_burned = {}
        workouts_by_date = Workout.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=end_date
        ).values('date').annotate(
            total_burned=Sum('total_calories_burned')
        ).order_by('date')
        
        for item in workouts_by_date:
            if item['total_burned']:
                daily_burned[str(item['date'])] = round(item['total_burned'], 0)
        
        # Fill all dates in range with calorie data
        current = start_date
        while current <= end_date:
            date_str = str(current)
            result['calorie_trends'].append({
                'date': date_str,
                'intake': daily_intake.get(date_str, 0),
                'burned': daily_burned.get(date_str, 0)
            })
            current += timedelta(days=1)
        
        # Process workout data
        if workout_trends:
            result['total_workouts'] = workout_trends.get('total_workouts', 0)
            result['workout_consistency'] = workout_trends.get('completion_rate', 0)
        
        # Get exercise type distribution
        result['exercise_types'] = cls.get_exercise_type_distribution_by_date(user, start_date, end_date)
        
        # Get user goals from profile
        try:
            profile = user.profile
            if hasattr(profile, 'target_weight') and profile.target_weight:
                result['weight_goal'] = float(profile.target_weight)
            if hasattr(profile, 'target_body_fat_percentage') and profile.target_body_fat_percentage:
                result['body_fat_goal'] = float(profile.target_body_fat_percentage)
        except:
            pass
        
        # Get workout goal from active workout schedule
        try:
            from ..workouts.models import WorkoutSchedule
            active_schedule = WorkoutSchedule.objects.filter(
                user=user,
                is_active=True,
                completed=False
            ).select_related('workout_plan').first()
            
            if active_schedule and active_schedule.workout_plan:
                result['workout_goal'] = active_schedule.workout_plan.days_per_week
                
                # Calculate workouts this week for active schedule
                from datetime import datetime
                today = timezone.now().date()
                # Get start of week (Monday)
                start_of_week = today - timedelta(days=today.weekday())
                end_of_week = start_of_week + timedelta(days=6)
                
                # Count workouts within this week and within schedule period
                schedule_start = active_schedule.start_date
                schedule_end = active_schedule.end_date
                
                workouts_this_week = Workout.objects.filter(
                    user=user,
                    date__gte=max(start_of_week, schedule_start),
                    date__lte=min(end_of_week, schedule_end) if schedule_end else end_of_week
                ).count()
                
                result['workouts_this_week'] = workouts_this_week
            else:
                # No active schedule, set to 0
                result['workout_goal'] = 0
                result['workouts_this_week'] = 0
        except Exception as e:
            # If error, set to 0
            result['workout_goal'] = 0
            result['workouts_this_week'] = 0
        
        # Add nested structures for frontend compatibility
        if weight_progress:
            result['weight_progress'] = {
                'weight_change': weight_progress.get('weight_change', 0),
                'start_weight': weight_progress.get('start_weight', 0),
                'current_weight': weight_progress.get('current_weight', 0)
            }
        else:
            result['weight_progress'] = None
            
        if workout_trends:
            result['workout_trends'] = {
                'total_workouts': workout_trends.get('completed_workouts', 0),
                'total_duration_minutes': workout_trends.get('total_duration_minutes', 0)
            }
        else:
            result['workout_trends'] = None
        
        return result
    
    @classmethod
    def get_comprehensive_report(cls, user, days=30):
        """Get comprehensive progress report"""
        # Get individual reports
        weight_progress = cls.get_weight_progress(user, days)
        body_composition = cls.get_body_composition_progress(user, days)
        nutrition_trends = cls.get_nutrition_trends(user, days)
        workout_trends = cls.get_workout_trends(user, days)
        
        # Format data for frontend compatibility
        result = {
            'period_days': days,
            'weight_history': [],
            'body_fat_history': [],
            'workout_frequency': [],
            'calorie_trends': [],
            'weight_change': 0,
            'body_fat_change': 0,
            'total_workouts': 0,
            'workout_consistency': 0,
            'avg_calories': 0,
            'target_calories': 2000,
            'current_weight': 0,
            'weight_goal': 0,
            'current_body_fat': 0,
            'body_fat_goal': 0,
            'workout_goal': 0,
            'workouts_this_week': 0,
            'achievements': []
        }
        
        # Process weight data
        if weight_progress and weight_progress.get('data'):
            result['weight_history'] = [
                {'date': item['date'], 'weight': item['weight']} 
                for item in weight_progress['data']
            ]
            result['weight_change'] = weight_progress.get('weight_change', 0)
            result['current_weight'] = weight_progress.get('current_weight', 0)
        
        # Process body composition data
        if body_composition:
            if body_composition.get('measurements'):
                result['body_fat_history'] = [
                    {'date': item['date'], 'body_fat_percentage': item['body_fat_percentage']}
                    for item in body_composition['measurements']
                ]
            result['body_fat_change'] = body_composition.get('body_fat_change', 0)
            result['start_body_fat'] = body_composition.get('start_body_fat')
            result['current_body_fat'] = body_composition.get('current_body_fat')
        
        # Process nutrition data and workout calories
        start_date = timezone.now().date() - timedelta(days=days)
        from ..nutrition.models import Meal
        from ..workouts.models import Workout
        from django.db.models import Sum, F
        
        # Get daily calorie intake (摂取カロリー)
        daily_intake = {}
        if nutrition_trends and nutrition_trends.get('total_meals_logged', 0) > 0:
            result['avg_calories'] = nutrition_trends.get('average_daily_calories', 0)
            
            meals_by_date = Meal.objects.filter(
                user=user,
                date__gte=start_date
            ).values('date').annotate(
                total_calories=Sum(F('items__calories'))
            ).order_by('date')
            
            for item in meals_by_date:
                if item['total_calories']:
                    daily_intake[str(item['date'])] = round(item['total_calories'], 0)
        
        # Get daily calories burned (消費カロリー)
        daily_burned = {}
        workouts_by_date = Workout.objects.filter(
            user=user,
            date__gte=start_date
        ).values('date').annotate(
            total_burned=Sum('total_calories_burned')
        ).order_by('date')
        
        for item in workouts_by_date:
            if item['total_burned']:
                daily_burned[str(item['date'])] = round(item['total_burned'], 0)
        
        # Combine both intake and burned calories
        all_dates = set(daily_intake.keys()) | set(daily_burned.keys())
        for date_str in sorted(all_dates):
            result['calorie_trends'].append({
                'date': date_str,
                'intake': daily_intake.get(date_str, 0),
                'burned': daily_burned.get(date_str, 0)
            })
        
        # Process workout data
        if workout_trends:
            result['total_workouts'] = workout_trends.get('total_workouts', 0)
            result['workout_consistency'] = workout_trends.get('completion_rate', 0)
            # Create mock workout frequency data (weekly)
            weeks = max(1, days // 7)
            workouts_per_week = result['total_workouts'] / weeks if weeks > 0 else 0
            for i in range(weeks):
                result['workout_frequency'].append({
                    'week': f'Week {i+1}',
                    'count': int(workouts_per_week)
                })
        
        # Get exercise type distribution
        result['exercise_types'] = cls.get_exercise_type_distribution(user, days)
        
        # Get user goals from profile
        try:
            profile = user.profile
            if hasattr(profile, 'target_weight') and profile.target_weight:
                result['weight_goal'] = float(profile.target_weight)
            if hasattr(profile, 'target_body_fat_percentage') and profile.target_body_fat_percentage:
                result['body_fat_goal'] = float(profile.target_body_fat_percentage)
        except:
            pass
        
        # Get workout goal from active workout schedule
        try:
            from ..workouts.models import WorkoutSchedule
            active_schedule = WorkoutSchedule.objects.filter(
                user=user,
                is_active=True,
                completed=False
            ).select_related('workout_plan').first()
            
            if active_schedule and active_schedule.workout_plan:
                result['workout_goal'] = active_schedule.workout_plan.days_per_week
                
                # Calculate workouts this week for active schedule
                today = timezone.now().date()
                # Get start of week (Monday)
                start_of_week = today - timedelta(days=today.weekday())
                end_of_week = start_of_week + timedelta(days=6)
                
                # Count workouts within this week and within schedule period
                schedule_start = active_schedule.start_date
                schedule_end = active_schedule.end_date
                
                workouts_this_week = Workout.objects.filter(
                    user=user,
                    date__gte=max(start_of_week, schedule_start),
                    date__lte=min(end_of_week, schedule_end) if schedule_end else end_of_week
                ).count()
                
                result['workouts_this_week'] = workouts_this_week
            else:
                # No active schedule, set to 0
                result['workout_goal'] = 0
                result['workouts_this_week'] = 0
        except Exception as e:
            # If error, set to 0
            result['workout_goal'] = 0
            result['workouts_this_week'] = 0
        
        # Add nested structures for frontend compatibility
        if weight_progress:
            result['weight_progress'] = {
                'weight_change': weight_progress.get('weight_change', 0),
                'start_weight': weight_progress.get('start_weight', 0),
                'current_weight': weight_progress.get('current_weight', 0)
            }
        else:
            result['weight_progress'] = None
            
        if workout_trends:
            result['workout_trends'] = {
                'total_workouts': workout_trends.get('completed_workouts', 0),
                'total_duration_minutes': workout_trends.get('total_duration_minutes', 0)
            }
        else:
            result['workout_trends'] = None
        
        return result


class GoalTracker:
    """Track progress towards goals"""
    
    @staticmethod
    def calculate_goal_progress(user):
        """Calculate progress towards user's goal"""
        try:
            profile = user.profile
            
            if not profile.target_weight:
                return None
            
            # Get starting and current weight
            measurements = BodyMeasurement.objects.filter(user=user).order_by('date')
            
            if measurements.count() < 2:
                return None
            
            start_measurement = measurements.first()
            current_measurement = measurements.last()
            
            start_weight = float(start_measurement.weight)
            current_weight = float(current_measurement.weight)
            target_weight = float(profile.target_weight)
            
            # Calculate progress
            total_to_lose = start_weight - target_weight
            lost_so_far = start_weight - current_weight
            
            if total_to_lose != 0:
                progress_percentage = (lost_so_far / total_to_lose) * 100
            else:
                progress_percentage = 100
            
            remaining = target_weight - current_weight
            
            # Estimate time to goal (assuming 0.5kg per week is healthy)
            weeks_to_goal = abs(remaining / 0.5) if remaining != 0 else 0
            
            return {
                'start_weight': start_weight,
                'current_weight': current_weight,
                'target_weight': target_weight,
                'weight_lost': round(lost_so_far, 2),
                'weight_remaining': round(remaining, 2),
                'progress_percentage': round(progress_percentage, 1),
                'estimated_weeks_to_goal': round(weeks_to_goal, 1),
                'on_track': -0.5 <= (lost_so_far / ((current_measurement.date - start_measurement.date).days / 7)) <= -0.3
            }
        
        except Exception as e:
            return None
