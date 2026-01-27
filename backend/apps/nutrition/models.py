"""
Models for nutrition tracking and meal planning
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.users.models import User


class Food(models.Model):
    """
    Model for food items in the database
    """
    CATEGORY_CHOICES = [
        ('protein', 'タンパク質'),
        ('carbs', '炭水化物'),
        ('fats', '脂質'),
        ('vegetables', '野菜'),
        ('fruits', '果物'),
        ('dairy', '乳製品'),
        ('grains', '穀物'),
        ('snacks', 'スナック'),
        ('beverages', '飲料'),
        ('other', 'その他'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='食品名')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name='カテゴリー')
    brand = models.CharField(max_length=100, blank=True, verbose_name='ブランド')
    
    # Nutritional information per 100g
    serving_size = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        default=100,
        help_text='Default serving size',
        verbose_name='Serving Size'
    )
    unit = models.CharField(
        max_length=20,
        default='g',
        help_text='Unit of measurement (g, ml, 個, etc.)',
        verbose_name='Unit'
    )
    calories = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        verbose_name='Calories (kcal)'
    )
    protein = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        verbose_name='Protein (g)'
    )
    carbohydrates = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        verbose_name='Carbohydrates (g)'
    )
    fats = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        verbose_name='Fats (g)'
    )
    fiber = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True,
        verbose_name='Fiber (g)'
    )
    sugar = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True,
        verbose_name='Sugar (g)'
    )
    sodium = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True,
        help_text='Sodium in milligrams',
        verbose_name='Sodium (mg)'
    )
    
    # Micronutrients (optional)
    vitamin_a = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name='Vitamin A (μg)'
    )
    vitamin_c = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name='Vitamin C (mg)'
    )
    calcium = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name='Calcium (mg)'
    )
    iron = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name='Iron (mg)'
    )
    
    # Additional info
    description = models.TextField(blank=True, verbose_name='Description')
    image = models.ImageField(upload_to='food_images/', blank=True, null=True, verbose_name='Image')
    is_custom = models.BooleanField(default=False, verbose_name='Custom Food')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='custom_foods',
        verbose_name='Created By'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = '食品'
        verbose_name_plural = '食品'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.brand})" if self.brand else self.name
    
    def get_nutrition_per_serving(self, serving_grams):
        """Calculate nutrition for a specific serving size"""
        multiplier = float(serving_grams) / float(self.serving_size)
        return {
            'calories': round(float(self.calories) * multiplier, 1),
            'protein': round(float(self.protein) * multiplier, 1),
            'carbohydrates': round(float(self.carbohydrates) * multiplier, 1),
            'fats': round(float(self.fats) * multiplier, 1),
        }


class Meal(models.Model):
    """
    Model for user meals
    """
    MEAL_TYPE_CHOICES = [
        ('breakfast', '朝食'),
        ('lunch', '昼食'),
        ('dinner', '夕食'),
        ('snack', '間食'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meals')
    name = models.CharField(max_length=200, verbose_name='食事名')
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES, verbose_name='食事タイプ')
    date = models.DateField(verbose_name='日付')
    time = models.TimeField(blank=True, null=True, verbose_name='時間')
    
    notes = models.TextField(blank=True, verbose_name='メモ')
    image = models.ImageField(upload_to='meal_images/', blank=True, null=True, verbose_name='画像')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = '食事'
        verbose_name_plural = '食事'
        ordering = ['-date', '-time']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['meal_type']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.name} ({self.date})"
    
    @property
    def total_calories(self):
        """Calculate total calories for this meal"""
        return round(sum(
            float(item.calories) for item in self.items.all()
        ), 1)
    
    @property
    def total_protein(self):
        """Calculate total protein for this meal"""
        return round(sum(
            float(item.protein) for item in self.items.all()
        ), 1)
    
    @property
    def total_carbs(self):
        """Calculate total carbohydrates for this meal"""
        return round(sum(
            float(item.carbohydrates) for item in self.items.all()
        ), 1)
    
    @property
    def total_fats(self):
        """Calculate total fats for this meal"""
        return round(sum(
            float(item.fats) for item in self.items.all()
        ), 1)


class MealItem(models.Model):
    """
    Model for individual food items in a meal
    """
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='items')
    food = models.ForeignKey(Food, on_delete=models.CASCADE, related_name='meal_items')
    serving_size = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        help_text='Serving size in grams',
        verbose_name='Serving Size (g)'
    )
    
    # Cached nutritional values for this serving
    calories = models.DecimalField(max_digits=6, decimal_places=1, verbose_name='Calories')
    protein = models.DecimalField(max_digits=5, decimal_places=1, verbose_name='Protein (g)')
    carbohydrates = models.DecimalField(max_digits=5, decimal_places=1, verbose_name='Carbs (g)')
    fats = models.DecimalField(max_digits=5, decimal_places=1, verbose_name='Fats (g)')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = '食事項目'
        verbose_name_plural = '食事項目'
    
    def __str__(self):
        return f"{self.food.name} - {self.serving_size}g"
    
    def save(self, *args, **kwargs):
        """Calculate and cache nutritional values before saving"""
        nutrition = self.food.get_nutrition_per_serving(self.serving_size)
        self.calories = nutrition['calories']
        self.protein = nutrition['protein']
        self.carbohydrates = nutrition['carbohydrates']
        self.fats = nutrition['fats']
        super().save(*args, **kwargs)


class MealPlan(models.Model):
    """
    Model for pre-defined meal plans
    """
    name = models.CharField(max_length=200, verbose_name='Plan Name')
    description = models.TextField(blank=True, default='', verbose_name='Description')
    goal = models.CharField(
        max_length=50,
        choices=[
            ('weight_loss', '減量'),
            ('muscle_gain', '筋肉増強'),
            ('maintenance', '維持'),
            ('endurance', '持久力'),
        ],
        blank=True,
        default='maintenance',
        verbose_name='目標'
    )
    daily_calories = models.IntegerField(verbose_name='Daily Calories Target')
    protein_percentage = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Protein %'
    )
    carbs_percentage = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Carbs %'
    )
    fats_percentage = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Fats %'
    )
    
    duration_days = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Duration of the plan in days',
        verbose_name='Duration (days)'
    )
    
    # Date range fields for plan activation
    start_date = models.DateField(
        null=True, 
        blank=True, 
        verbose_name='Start Date',
        help_text='Date when this plan becomes active'
    )
    end_date = models.DateField(
        null=True, 
        blank=True, 
        verbose_name='End Date',
        help_text='Date when this plan ends'
    )
    
    is_active = models.BooleanField(default=True, verbose_name='Active')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_meal_plans',
        verbose_name='Created By'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = '食事プラン'
        verbose_name_plural = '食事プラン'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.goal}"


class FavoriteFood(models.Model):
    """
    Model for user's favorite foods
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_foods')
    food = models.ForeignKey(Food, on_delete=models.CASCADE, related_name='favorited_by')
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'お気に入り食品'
        verbose_name_plural = 'お気に入り食品'
        unique_together = ['user', 'food']
        ordering = ['-added_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.food.name}"


class FavoriteMeal(models.Model):
    """
    Model for user's favorite meals (templates)
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_meals')
    name = models.CharField(max_length=200, verbose_name='食事名')
    meal_type = models.CharField(
        max_length=20,
        choices=Meal.MEAL_TYPE_CHOICES,
        verbose_name='食事タイプ'
    )
    description = models.TextField(blank=True, verbose_name='説明')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'お気に入り食事'
        verbose_name_plural = 'お気に入り食事'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.name}"


class FavoriteMealItem(models.Model):
    """
    Model for items in a favorite meal template
    """
    favorite_meal = models.ForeignKey(
        FavoriteMeal,
        on_delete=models.CASCADE,
        related_name='items'
    )
    food = models.ForeignKey(Food, on_delete=models.CASCADE)
    serving_size = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        verbose_name='Serving Size (g)'
    )
    
    class Meta:
        verbose_name = 'お気に入り食事項目'
        verbose_name_plural = 'お気に入り食事項目'
    
    def __str__(self):
        return f"{self.food.name} - {self.serving_size}g"


class Recipe(models.Model):
    """
    Model for user recipes
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipes')
    name = models.CharField(max_length=200, verbose_name='レシピ名')
    description = models.TextField(verbose_name='説明')
    
    # Nutritional information
    calories = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        verbose_name='Calories (kcal)'
    )
    protein = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        verbose_name='Protein (g)'
    )
    carbs = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        verbose_name='Carbs (g)'
    )
    fats = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        validators=[MinValueValidator(0)],
        verbose_name='Fats (g)'
    )
    
    # Additional info
    time = models.CharField(max_length=50, verbose_name='調理時間')
    servings = models.CharField(max_length=50, verbose_name='人数')
    image = models.ImageField(upload_to='recipe_images/', blank=True, null=True, verbose_name='画像')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'レシピ'
        verbose_name_plural = 'レシピ'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.name}"
