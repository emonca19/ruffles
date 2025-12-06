import contextlib
import importlib
from typing import Any

from django.contrib.auth import get_user_model

import pytest

APIClient: Any

try:
    _mod = importlib.import_module("rest_framework.test")
    APIClient = _mod.APIClient
except Exception:

    class FakeAPIClient:
        def __init__(self):
            pass

        def credentials(self, **kwargs):
            return None

        def force_authenticate(self, user=None):
            pass

        def get(self, *args, **kwargs):
            raise RuntimeError("rest_framework not available in this environment")

        def post(self, *args, **kwargs):
            raise RuntimeError("rest_framework not available in this environment")

    APIClient = FakeAPIClient


pytestmark = pytest.mark.django_db


@pytest.fixture
def user_factory(db):
    User = get_user_model()

    def make_user(**kwargs):
        email = kwargs.get("email", "user@example.com")
        password = kwargs.get("password", "password123")
        name = kwargs.get("name", "Test User")
        is_staff = kwargs.get("is_staff", False)
        is_superuser = kwargs.get("is_superuser", False)
        is_active = kwargs.get("is_active", True)
        is_blocked = kwargs.get("is_blocked", False)
        user_type = kwargs.get("user_type")

        # Create using the custom User model's API
        create_kwargs = {
            "email": email,
            "password": password,
            "name": name,
            "is_staff": is_staff,
            "is_superuser": is_superuser,
            "is_active": is_active,
        }
        if user_type is not None:
            create_kwargs["user_type"] = user_type

        user = User.objects.create_user(**create_kwargs)  # type: ignore

        try:
            # Ensure name is set even if manager ignored it
            if getattr(user, "name", None) != name:
                user.name = name
            user.save()

            # Store blocked flag in cache so views/services can pick it up even if
            # the concrete user model doesn't have an is_blocked field.
            if is_blocked:
                try:
                    from django.core.cache import cache

                    cache.set(f"user_blocked:{user.id}", True)
                except Exception:
                    # If cache isn't available in this environment, set an
                    # attribute on the instance as a shallow fallback.
                    with contextlib.suppress(Exception):
                        user.is_blocked = True
        except Exception:
            pass
        return user

    return make_user


@pytest.fixture
def organizer_user(db, user_factory):
    import uuid

    unique_email = f"organizer-{uuid.uuid4().hex[:8]}@example.com"
    return user_factory(email=unique_email, password="OrgPass123", name="Organizer")


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def api_client_with_token(db, user_factory):
    def _client(user=None):
        client = APIClient()
        if user is None:
            user = user_factory()
        token = f"test-token-{user.id}"
        with contextlib.suppress(Exception):
            client.force_authenticate(user=user)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return client

    return _client


@pytest.fixture
def mocker(monkeypatch):
    class _Mocker:
        def patch(self, target, **kwargs):
            if "side_effect" in kwargs:
                se = kwargs["side_effect"]
                if isinstance(se, Exception):

                    def _fn_exception(*a, **k):
                        raise se

                    callback = _fn_exception
                else:

                    def _fn_call(*a, **k):
                        return se(*a, **k)

                    callback = _fn_call

                monkeypatch.setattr(target, callback, raising=False)
                return
            if "new" in kwargs:
                monkeypatch.setattr(target, kwargs["new"], raising=False)
                return
            if "return_value" in kwargs:

                def _fn_return(*a, **k):
                    return kwargs["return_value"]

                monkeypatch.setattr(target, _fn_return, raising=False)
                return
            raise ValueError("Unsupported mocker.patch call")

        def setattr(self, target, value, raising=True):
            monkeypatch.setattr(target, value, raising=raising)

    return _Mocker()
