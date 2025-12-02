"""Authentication API routes."""

from django.urls import path

from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import CurrentUserView, RegistrationView

token_obtain_view = extend_schema(
    tags=["Auth"],
    summary="Obtain JWT token pair",
    description="Exchange credentials for access and refresh tokens.",
)(TokenObtainPairView)

token_refresh_view = extend_schema(
    tags=["Auth"],
    summary="Refresh JWT access token",
    description="Use a refresh token to issue a new access token.",
)(TokenRefreshView)

urlpatterns = [
    path("register/", RegistrationView.as_view(), name="auth-register"),
    path("me/", CurrentUserView.as_view(), name="auth-me"),
    path("token/", token_obtain_view.as_view(), name="token_obtain_pair"),
    path("token/refresh/", token_refresh_view.as_view(), name="token_refresh"),
]
