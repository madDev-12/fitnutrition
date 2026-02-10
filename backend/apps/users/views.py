from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.db.models import Q
from .serializers import (
    UserSerializer, 
    UserProfileSerializer, 
    UserRegistrationSerializer,
    FoodPreferenceSerializer,
    UserPreferencesSerializer
)
from .models import UserProfile, FoodPreference, UserPreferences
from datetime import date
import os

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def create_superuser_endpoint(request):
    """
    Emergency endpoint to create superuser
    Protected by secret key in request
    """
    secret = request.data.get('secret')
    expected_secret = os.environ.get('SUPERUSER_CREATE_SECRET', 'fitnutrition-secret-2024')
    
    if secret != expected_secret:
        return Response(
            {'error': 'Invalid secret'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    email = request.data.get('email', 'admin@fitnutrition.com')
    username = request.data.get('username', 'admin')
    password = request.data.get('password', 'admin123456')
    
    try:
        # Check if user exists
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            # Update to superuser
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.set_password(password)  # Re-hash password
            user.save()
            
            return Response({
                'message': 'User updated to superuser',
                'email': user.email,
                'username': user.username,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_active': user.is_active,
            })
        else:
            # Create new superuser
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
            
            return Response({
                'message': 'Superuser created successfully',
                'email': user.email,
                'username': user.username,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_active': user.is_active,
            })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class UserLoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
            user = authenticate(username=user.username, password=password)
            
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                })
            else:
                return Response(
                    {'error': 'Invalid credentials'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class FoodPreferenceViewSet(viewsets.ModelViewSet):
    queryset = FoodPreference.objects.all()
    serializer_class = FoodPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FoodPreference.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserPreferencesViewSet(viewsets.ModelViewSet):
    queryset = UserPreferences.objects.all()
    serializer_class = UserPreferencesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserPreferences.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        try:
            preferences = UserPreferences.objects.get(user=request.user)
            serializer = self.get_serializer(preferences)
            return Response(serializer.data)
        except UserPreferences.DoesNotExist:
            # Create default preferences if not exists
            preferences = UserPreferences.objects.create(user=request.user)
            serializer = self.get_serializer(preferences)
            return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
