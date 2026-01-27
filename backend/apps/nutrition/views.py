"""
Views for Nutrition app
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (
    Food, Meal, MealItem, MealPlan,
    FavoriteFood, FavoriteMeal, FavoriteMealItem, Recipe
)
from .serializers import (
    FoodSerializer, FoodCreateSerializer,
    MealSerializer, MealCreateSerializer, MealItemSerializer,
    MealPlanSerializer, FavoriteFoodSerializer,
    FavoriteMealSerializer, FavoriteMealCreateSerializer,
    DailyNutritionSummarySerializer, RecipeSerializer
)


class FoodViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Food model
    Provides CRUD operations for foods
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand', 'category']
    ordering_fields = ['name', 'calories', 'protein', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Return all foods and user's custom foods"""
        user = self.request.user
        return Food.objects.filter(
            Q(is_custom=False) | Q(created_by=user)
        )
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return FoodCreateSerializer
        return FoodSerializer
    
    def create(self, request, *args, **kwargs):
        """Override create to add detailed logging"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Received food creation request with data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """Set the food as custom and assign to current user"""
        serializer.save(created_by=self.request.user, is_custom=True)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get list of food categories"""
        categories = Food.objects.values_list('category', flat=True).distinct()
        return Response({'categories': list(categories)})
    
    @action(detail=False, methods=['get'])
    def my_custom(self, request):
        """Get user's custom foods"""
        foods = Food.objects.filter(created_by=request.user, is_custom=True)
        serializer = self.get_serializer(foods, many=True)
        return Response(serializer.data)


class MealViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Meal model
    Provides CRUD operations for meals
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'time', 'created_at']
    ordering = ['-date', '-time']
    
    def get_queryset(self):
        """Return meals for the current user"""
        queryset = Meal.objects.filter(user=self.request.user).prefetch_related('items__food')
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Filter by meal type
        meal_type = self.request.query_params.get('meal_type')
        if meal_type:
            queryset = queryset.filter(meal_type=meal_type)
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return MealCreateSerializer
        return MealSerializer
    
    def perform_create(self, serializer):
        """Assign meal to current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's meals"""
        today = timezone.now().date()
        meals = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(meals, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        """Get daily nutrition summary"""
        date_str = request.query_params.get('date', timezone.now().date())
        if isinstance(date_str, str):
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date = date_str
        
        meals = Meal.objects.filter(user=request.user, date=date)
        
        # Calculate totals
        total_calories = sum(meal.total_calories for meal in meals)
        total_protein = sum(meal.total_protein for meal in meals)
        total_carbs = sum(meal.total_carbs for meal in meals)
        total_fats = sum(meal.total_fats for meal in meals)
        
        # Get user's target calories
        target_calories = None
        calories_remaining = None
        if hasattr(request.user, 'profile'):
            target_calories = request.user.profile.daily_calorie_target
            if target_calories:
                calories_remaining = target_calories - total_calories
        
        data = {
            'date': date,
            'total_calories': total_calories,
            'total_protein': total_protein,
            'total_carbs': total_carbs,
            'total_fats': total_fats,
            'meals_count': meals.count(),
            'target_calories': target_calories,
            'calories_remaining': calories_remaining
        }
        
        serializer = DailyNutritionSummarySerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def weekly_summary(self, request):
        """Get weekly nutrition summary"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=6)
        
        daily_summaries = []
        current_date = start_date
        
        while current_date <= end_date:
            meals = Meal.objects.filter(user=request.user, date=current_date)
            
            total_calories = sum(meal.total_calories for meal in meals)
            total_protein = sum(meal.total_protein for meal in meals)
            total_carbs = sum(meal.total_carbs for meal in meals)
            total_fats = sum(meal.total_fats for meal in meals)
            
            daily_summaries.append({
                'date': current_date,
                'total_calories': total_calories,
                'total_protein': total_protein,
                'total_carbs': total_carbs,
                'total_fats': total_fats,
                'meals_count': meals.count()
            })
            
            current_date += timedelta(days=1)
        
        return Response(daily_summaries)
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add an item to a meal"""
        meal = self.get_object()
        serializer = MealItemSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(meal=meal)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def remove_item(self, request, pk=None):
        """Remove an item from a meal"""
        meal = self.get_object()
        item_id = request.data.get('item_id')
        
        try:
            item = MealItem.objects.get(id=item_id, meal=meal)
            item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except MealItem.DoesNotExist:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class MealPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MealPlan model
    Provides CRUD operations for meal plans
    """
    serializer_class = MealPlanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'daily_calories', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Return meal plans for the current user"""
        # Show both user's custom plans and global active plans
        queryset = MealPlan.objects.filter(
            Q(created_by=self.request.user) | Q(is_active=True, created_by__isnull=True)
        )
        
        # Filter by goal if provided
        goal = self.request.query_params.get('goal')
        if goal:
            queryset = queryset.filter(goal=goal)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Override create to add detailed logging"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Received meal plan creation request with data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """Assign meal plan to current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def goals(self, request):
        """Get list of available goals"""
        goals = MealPlan.objects.values_list('goal', flat=True).distinct()
        return Response({'goals': list(goals)})


class FavoriteFoodViewSet(viewsets.ModelViewSet):
    """
    ViewSet for FavoriteFood model
    Manage user's favorite foods
    """
    serializer_class = FavoriteFoodSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return favorite foods for the current user"""
        return FavoriteFood.objects.filter(user=self.request.user).select_related('food')
    
    def perform_create(self, serializer):
        """Assign favorite to current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Toggle a food as favorite"""
        food_id = request.data.get('food_id')
        
        if not food_id:
            return Response(
                {'error': 'food_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        favorite, created = FavoriteFood.objects.get_or_create(
            user=request.user,
            food_id=food_id
        )
        
        if not created:
            favorite.delete()
            return Response(
                {'message': 'Removed from favorites'},
                status=status.HTTP_200_OK
            )
        
        serializer = self.get_serializer(favorite)
        return Response(
            {'message': 'Added to favorites', 'data': serializer.data},
            status=status.HTTP_201_CREATED
        )


class FavoriteMealViewSet(viewsets.ModelViewSet):
    """
    ViewSet for FavoriteMeal model
    Manage user's favorite meal templates
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return favorite meals for the current user"""
        return FavoriteMeal.objects.filter(user=self.request.user).prefetch_related('items__food')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return FavoriteMealCreateSerializer
        return FavoriteMealSerializer
    
    def perform_create(self, serializer):
        """Assign favorite meal to current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def use_template(self, request, pk=None):
        """Create a meal from a favorite meal template"""
        favorite_meal = self.get_object()
        date = request.data.get('date', timezone.now().date())
        time = request.data.get('time')
        
        # Create new meal
        meal = Meal.objects.create(
            user=request.user,
            name=favorite_meal.name,
            meal_type=favorite_meal.meal_type,
            date=date,
            time=time
        )
        
        # Copy items from template
        for item in favorite_meal.items.all():
            MealItem.objects.create(
                meal=meal,
                food=item.food,
                serving_size=item.serving_size
            )
        
        serializer = MealSerializer(meal)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RecipeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Recipe model
    Provides CRUD operations for recipes
    """
    serializer_class = RecipeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return recipes for the current user"""
        return Recipe.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Assign recipe to current user"""
        serializer.save(user=self.request.user)
