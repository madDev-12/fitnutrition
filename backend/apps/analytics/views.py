from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .services import (
    MetabolismCalculator, MacroCalculator,
    ProgressAnalyzer, GoalTracker
)


class MetabolismView(APIView):
    """Calculate BMR and TDEE"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get BMR and TDEE for current user"""
        result = MetabolismCalculator.calculate_for_user(request.user)
        
        if result is None:
            return Response(
                {'error': 'Unable to calculate. Please ensure you have a profile and body measurements.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(result)


class MacroCalculatorView(APIView):
    """Calculate macro distribution"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Calculate macros based on user's TDEE and goal"""
        # Get TDEE
        metabolism = MetabolismCalculator.calculate_for_user(request.user)
        
        if metabolism is None:
            return Response(
                {'error': 'Unable to calculate. Please ensure you have a profile and body measurements.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tdee = metabolism['tdee']
        
        # Get goal from profile or query params
        goal = request.query_params.get('goal')
        if not goal:
            try:
                goal = request.user.profile.fitness_goal
            except:
                goal = 'maintenance'
        
        # Get calorie adjustment
        calorie_adjustment = MacroCalculator.get_calorie_adjustment(goal)
        
        # Allow custom adjustment from query params
        custom_adjustment = request.query_params.get('calorie_adjustment')
        if custom_adjustment:
            try:
                calorie_adjustment = int(custom_adjustment)
            except ValueError:
                pass
        
        # Calculate macros
        macros = MacroCalculator.calculate_macros(tdee, goal, calorie_adjustment)
        
        return Response({
            'tdee': tdee,
            'goal': goal,
            'calorie_adjustment': calorie_adjustment,
            'macros': macros
        })


class ProgressAnalysisView(APIView):
    """Analyze user progress"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get progress analysis"""
        from datetime import datetime
        
        # Get date range from query params
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # If date range provided, use it; otherwise fall back to days
        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Fall back to days parameter
            days = request.query_params.get('days', 30)
            try:
                days = int(days)
            except ValueError:
                days = 30
            start_date = None
            end_date = None
        
        # Get analysis type
        analysis_type = request.query_params.get('type', 'comprehensive')
        
        if analysis_type == 'weight':
            if start_date and end_date:
                result = ProgressAnalyzer.get_weight_progress_by_date(request.user, start_date, end_date)
            else:
                result = ProgressAnalyzer.get_weight_progress(request.user, days)
        elif analysis_type == 'body_composition':
            if start_date and end_date:
                result = ProgressAnalyzer.get_body_composition_progress_by_date(request.user, start_date, end_date)
            else:
                result = ProgressAnalyzer.get_body_composition_progress(request.user, days)
        elif analysis_type == 'nutrition':
            if start_date and end_date:
                result = ProgressAnalyzer.get_nutrition_trends_by_date(request.user, start_date, end_date)
            else:
                result = ProgressAnalyzer.get_nutrition_trends(request.user, days)
        elif analysis_type == 'workout':
            if start_date and end_date:
                result = ProgressAnalyzer.get_workout_trends_by_date(request.user, start_date, end_date)
            else:
                result = ProgressAnalyzer.get_workout_trends(request.user, days)
        else:  # comprehensive
            if start_date and end_date:
                result = ProgressAnalyzer.get_comprehensive_report_by_date(request.user, start_date, end_date)
            else:
                result = ProgressAnalyzer.get_comprehensive_report(request.user, days)
        
        if result is None:
            return Response(
                {'error': 'No data available for analysis'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(result)


class GoalProgressView(APIView):
    """Track progress towards goal"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get goal progress"""
        result = GoalTracker.calculate_goal_progress(request.user)
        
        if result is None:
            return Response(
                {'error': 'Unable to calculate goal progress. Please set a target weight and have at least 2 measurements.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(result)


class DashboardStatsView(APIView):
    """Get dashboard statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all stats for dashboard"""
        # Get metabolism data
        metabolism = MetabolismCalculator.calculate_for_user(request.user)
        
        # Get goal progress
        goal_progress = GoalTracker.calculate_goal_progress(request.user)
        
        # Get recent progress (7 days)
        recent_progress = ProgressAnalyzer.get_comprehensive_report(request.user, 7)
        
        # Get monthly progress (30 days)
        monthly_progress = ProgressAnalyzer.get_comprehensive_report(request.user, 30)
        
        return Response({
            'metabolism': metabolism,
            'goal_progress': goal_progress,
            'recent_progress': recent_progress,
            'monthly_progress': monthly_progress
        })


class CalorieCalculatorView(APIView):
    """Calculate calorie needs"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Calculate calories based on custom inputs"""
        data = request.data
        
        # Get required fields
        weight = data.get('weight')
        height = data.get('height')
        age = data.get('age')
        gender = data.get('gender')
        activity_level = data.get('activity_level', 'moderate')
        goal = data.get('goal', 'maintenance')
        
        if not all([weight, height, age, gender]):
            return Response(
                {'error': 'Missing required fields: weight, height, age, gender'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Calculate BMR
            bmr = MetabolismCalculator.calculate_bmr(
                float(weight),
                float(height),
                int(age),
                gender
            )
            
            # Calculate TDEE
            tdee = MetabolismCalculator.calculate_tdee(bmr, activity_level)
            
            # Calculate macros
            calorie_adjustment = MacroCalculator.get_calorie_adjustment(goal)
            macros = MacroCalculator.calculate_macros(tdee, goal, calorie_adjustment)
            
            return Response({
                'bmr': bmr,
                'tdee': tdee,
                'activity_level': activity_level,
                'goal': goal,
                'macros': macros
            })
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
