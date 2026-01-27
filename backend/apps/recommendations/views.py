from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .services import (
    WorkoutRecommendationEngine,
    NutritionRecommendationEngine,
    AIRecommendationEngine
)


class WorkoutRecommendationsView(APIView):
    """Get workout recommendations"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get personalized workout recommendations"""
        recommendation_type = request.query_params.get('type', 'plans')
        
        if recommendation_type == 'plans':
            recommendations = WorkoutRecommendationEngine.get_workout_plan_recommendations(request.user)
        elif recommendation_type == 'exercises':
            recommendations = WorkoutRecommendationEngine.get_exercise_recommendations(request.user)
        elif recommendation_type == 'tips':
            recommendations = WorkoutRecommendationEngine.get_daily_workout_tip(request.user)
        else:
            return Response(
                {'error': 'Invalid type. Use: plans, exercises, or tips'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'type': recommendation_type,
            'recommendations': recommendations
        })


class NutritionRecommendationsView(APIView):
    """Get nutrition recommendations"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get personalized nutrition recommendations"""
        recommendation_type = request.query_params.get('type', 'meals')
        
        if recommendation_type == 'meals':
            recommendations = NutritionRecommendationEngine.get_meal_recommendations(request.user)
        elif recommendation_type == 'tips':
            recommendations = NutritionRecommendationEngine.get_nutrition_tips(request.user)
        elif recommendation_type == 'foods':
            meal_type = request.query_params.get('meal_type', 'lunch')
            recommendations = NutritionRecommendationEngine.get_food_suggestions(request.user, meal_type)
        else:
            return Response(
                {'error': 'Invalid type. Use: meals, tips, or foods'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'type': recommendation_type,
            'recommendations': recommendations
        })


class PersonalizedPlanView(APIView):
    """Get comprehensive personalized plan"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get AI-powered personalized plan"""
        plan = AIRecommendationEngine.generate_personalized_plan(request.user)
        
        if plan is None:
            return Response(
                {'error': 'Unable to generate plan. Please ensure your profile is complete.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(plan)


class AIInsightsView(APIView):
    """Get AI-generated insights"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get AI insights about user's progress"""
        insights = AIRecommendationEngine.get_ai_insights(request.user)
        
        return Response({
            'insights': insights,
            'note': 'AI insights are currently rule-based. OpenAI integration can be added for more advanced recommendations.'
        })


class DailyRecommendationsView(APIView):
    """Get daily recommendations"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all daily recommendations"""
        workout_tips = WorkoutRecommendationEngine.get_daily_workout_tip(request.user)
        nutrition_tips = NutritionRecommendationEngine.get_nutrition_tips(request.user)
        ai_insights = AIRecommendationEngine.get_ai_insights(request.user)
        
        return Response({
            'workout_tips': workout_tips,
            'nutrition_tips': nutrition_tips,
            'ai_insights': ai_insights,
            'date': request.query_params.get('date', 'today')
        })
