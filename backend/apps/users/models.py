"""
User Models for FitNutrition
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class User(AbstractUser):
    """
    Custom User Model extending Django's AbstractUser
    """
    email = models.EmailField(unique=True, verbose_name='メールアドレス')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='電話番号')
    date_of_birth = models.DateField(blank=True, null=True, verbose_name='生年月日')
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True,
        verbose_name='プロフィール画像'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = 'ユーザー'
        verbose_name_plural = 'ユーザー'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    @property
    def age(self):
        """Calculate user's age from date of birth"""
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None


class UserProfile(models.Model):
    """
    Extended User Profile with fitness-related information
    """
    GENDER_CHOICES = [
        ('male', '男性'),
        ('female', '女性'),
        ('other', 'その他'),
    ]
    
    ACTIVITY_LEVEL_CHOICES = [
        ('sedentary', '座りがち（ほとんど運動なし）'),
        ('light', '軽い活動（週1-3日の軽い運動）'),
        ('moderate', '中程度の活動（週3-5日の中程度の運動）'),
        ('very', '活発（週6-7日のハードな運動）'),
        ('extra', '非常に活発（非常にハードな運動、肉体労働）'),
    ]
    
    FITNESS_GOAL_CHOICES = [
        ('weight_loss', '減量'),
        ('muscle_gain', '筋肉増強'),
        ('maintenance', '維持'),
        ('endurance', '持久力'),
        ('flexibility', '柔軟性'),
        ('general_fitness', '総合的なフィットネス'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True, verbose_name='性別')
    height = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(50), MaxValueValidator(300)],
        blank=True,
        null=True,
        help_text='身長（センチメートル）',
        verbose_name='身長 (cm)'
    )
    current_weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(20), MaxValueValidator(500)],
        blank=True,
        null=True,
        help_text='現在の体重（キログラム）',
        verbose_name='現在の体重 (kg)'
    )
    target_weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(20), MaxValueValidator(500)],
        blank=True,
        null=True,
        help_text='目標体重（キログラム）',
        verbose_name='目標体重 (kg)'
    )
    activity_level = models.CharField(
        max_length=20,
        choices=ACTIVITY_LEVEL_CHOICES,
        default='moderate',
        verbose_name='活動レベル'
    )
    fitness_goal = models.CharField(
        max_length=20,
        choices=FITNESS_GOAL_CHOICES,
        default='general_fitness',
        verbose_name='フィットネス目標'
    )
    body_fat_percentage = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(3), MaxValueValidator(60)],
        blank=True,
        null=True,
        verbose_name='体脂肪率'
    )
    target_body_fat_percentage = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        validators=[MinValueValidator(3), MaxValueValidator(60)],
        blank=True,
        null=True,
        verbose_name='体脂肪率目標'
    )
    
    # Body Measurements (optional)
    chest = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name='胸囲 (cm)'
    )
    waist = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name='ウエスト (cm)'
    )
    hips = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name='ヒップ (cm)'
    )
    arms = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name='腕周り (cm)'
    )
    thighs = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name='太もも (cm)'
    )
    calves = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name='ふくらはぎ (cm)'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'ユーザープロフィール'
        verbose_name_plural = 'ユーザープロフィール'
    
    def __str__(self):
        return f"{self.user.get_full_name()}'s Profile"
    
    @property
    def bmi(self):
        """Calculate Body Mass Index"""
        if self.height and self.current_weight:
            height_m = float(self.height) / 100
            return round(float(self.current_weight) / (height_m ** 2), 1)
        return None
    
    @property
    def bmr(self):
        """Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation"""
        if not all([self.current_weight, self.height, self.user.age, self.gender]):
            return None
        
        weight = float(self.current_weight)
        height = float(self.height)
        age = self.user.age
        
        if self.gender == 'male':
            return round(10 * weight + 6.25 * height - 5 * age + 5, 0)
        else:  # female or other
            return round(10 * weight + 6.25 * height - 5 * age - 161, 0)
    
    @property
    def tdee(self):
        """Calculate Total Daily Energy Expenditure"""
        if not self.bmr:
            return None
        
        activity_multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'very': 1.725,
            'extra': 1.9,
        }
        
        multiplier = activity_multipliers.get(self.activity_level, 1.55)
        return round(self.bmr * multiplier, 0)
    
    @property
    def daily_calorie_target(self):
        """Calculate daily calorie target based on fitness goal"""
        if not self.tdee:
            return None
        
        goal_adjustments = {
            'weight_loss': -500,  # 500 calorie deficit
            'muscle_gain': 300,   # 300 calorie surplus
            'maintenance': 0,
            'endurance': 200,
            'flexibility': 0,
            'general_fitness': 0,
        }
        
        adjustment = goal_adjustments.get(self.fitness_goal, 0)
        return round(self.tdee + adjustment, 0)
    
    @property
    def macro_targets(self):
        """Calculate macronutrient targets based on fitness goal"""
        if not self.daily_calorie_target:
            return None
        
        calories = float(self.daily_calorie_target)
        weight = float(self.current_weight)
        
        # Macro ratios based on fitness goal
        if self.fitness_goal == 'weight_loss':
            protein_ratio = 0.35
            carb_ratio = 0.35
            fat_ratio = 0.30
        elif self.fitness_goal == 'muscle_gain':
            protein_ratio = 0.30
            carb_ratio = 0.45
            fat_ratio = 0.25
        else:  # maintenance, endurance, etc.
            protein_ratio = 0.30
            carb_ratio = 0.40
            fat_ratio = 0.30
        
        return {
            'protein': round((calories * protein_ratio) / 4, 0),  # 4 cal/g
            'carbs': round((calories * carb_ratio) / 4, 0),       # 4 cal/g
            'fats': round((calories * fat_ratio) / 9, 0),         # 9 cal/g
        }


class FoodPreference(models.Model):
    """
    User's food preferences, allergies, and dietary restrictions
    """
    DIET_TYPE_CHOICES = [
        ('omnivore', '雑食'),
        ('vegetarian', 'ベジタリアン'),
        ('vegan', 'ビーガン'),
        ('pescatarian', 'ペスカタリアン'),
        ('keto', 'ケトジェニック'),
        ('paleo', 'パレオ'),
        ('mediterranean', '地中海式'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='food_preferences')
    diet_type = models.CharField(
        max_length=20,
        choices=DIET_TYPE_CHOICES,
        default='omnivore',
        verbose_name='食事タイプ'
    )
    allergies = models.TextField(
        blank=True,
        help_text='食物アレルギーをリスト（カンマ区切り）',
        verbose_name='アレルギー'
    )
    dislikes = models.TextField(
        blank=True,
        help_text='嫌いな食べ物（カンマ区切り）',
        verbose_name='嫌いな食べ物'
    )
    preferred_foods = models.TextField(
        blank=True,
        help_text='好きな食べ物（カンマ区切り）',
        verbose_name='好きな食べ物'
    )
    avoid_ingredients = models.TextField(
        blank=True,
        help_text='避けたい食材（カンマ区切り）',
        verbose_name='避けたい食材'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = '食品の好み'
        verbose_name_plural = '食品の好み'
    
    def __str__(self):
        return f"{self.user.get_full_name()}'s Food Preferences"


class UserPreferences(models.Model):
    """
    User's notification and app preferences
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    email_notifications = models.BooleanField(default=True, verbose_name='メール通知')
    workout_reminders = models.BooleanField(default=True, verbose_name='ワークアウトリマインダー')
    meal_reminders = models.BooleanField(default=True, verbose_name='食事リマインダー')
    progress_updates = models.BooleanField(default=True, verbose_name='進捗更新')
    weekly_summary = models.BooleanField(default=True, verbose_name='週間サマリー')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'ユーザー設定'
        verbose_name_plural = 'ユーザー設定'
    
    def __str__(self):
        return f"{self.user.get_full_name()}'s Preferences"
