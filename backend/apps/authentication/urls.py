from django.urls import path
from importlib import import_module
from django.http import JsonResponse
from .views import RegisterView


def login_endpoint(request, *args, **kwargs):
    login_view = import_module("auth.views").login_view
    try:
        return login_view(request, *args, **kwargs)
    except Exception:
        return JsonResponse({"error": "Internal server error"}, status=500)


urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", login_endpoint, name="auth-login"),
]
