"""Authentication API routes."""

from django.urls import path

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import CurrentUserView, RegistrationView

urlpatterns = [
    path("register/", RegistrationView.as_view(), name="auth-register"),
    path("me/", CurrentUserView.as_view(), name="auth-me"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
