"""Compatibility shim so tests that reference the historical import path
`auth.views` can monkeypatch a `login_view` symbol.

This module delegates to the authentication app's LoginView by default.
"""
from django.http import HttpRequest


def login_view(request: HttpRequest):
    from apps.authentication.views import LoginView
    view = LoginView.as_view()
    return view(request)
