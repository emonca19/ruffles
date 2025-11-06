"""Shim models module exposing the project's user model as `User`.

Tests import `from users.models import User`, so this module maps that
name to Django's configured user model (usually `auth.User`).
"""
from django.contrib.auth import get_user_model

# Expose the actual user model class as `User` so imports like
# `from users.models import User` succeed.
User = get_user_model()
