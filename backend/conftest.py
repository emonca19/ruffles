import importlib

from django.contrib.auth import get_user_model

import pytest

APIClient = None
try:
    _mod = importlib.import_module("rest_framework.test")
    APIClient = _mod.APIClient
except Exception:

    class APIClient:
        def __init__(self):
            pass

        def credentials(self, **kwargs):
            return None

        def get(self, *args, **kwargs):
            raise RuntimeError("rest_framework not available in this environment")

        def post(self, *args, **kwargs):
            raise RuntimeError("rest_framework not available in this environment")


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

        user = User.objects.create_user(username=email, email=email, password=password)
        try:
            user.first_name = name
            user.is_staff = is_staff
            user.is_superuser = is_superuser
            user.is_active = is_active
            user.save()
            # Store blocked flag in cache so LoginView can pick it up even if
            # the concrete user model doesn't have an is_blocked field.
            if is_blocked:
                try:
                    from django.core.cache import cache

                    cache.set(f"user_blocked:{user.id}", True)
                except Exception:
                    # If cache isn't available in this environment, set an
                    # attribute on the instance as a shallow fallback.
                    try:
                        user.is_blocked = True
                    except Exception:
                        pass
        except Exception:
            pass
        return user

    return make_user


@pytest.fixture
def organizer_user(db, user_factory):
    return user_factory(
        email="organizer@example.com", password="OrgPass123", name="Organizer"
    )


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
        try:
            client.force_authenticate(user=user)
        except Exception:
            pass
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

                    def _fn(*a, **k):
                        raise se
                else:

                    def _fn(*a, **k):
                        return se(*a, **k)

                monkeypatch.setattr(target, _fn, raising=False)
                return
            if "new" in kwargs:
                monkeypatch.setattr(target, kwargs["new"], raising=False)
                return
            if "return_value" in kwargs:

                def _fn(*a, **k):
                    return kwargs["return_value"]

                monkeypatch.setattr(target, _fn, raising=False)
                return
            raise ValueError("Unsupported mocker.patch call")

        def setattr(self, target, value, raising=True):
            monkeypatch.setattr(target, value, raising=raising)

    return _Mocker()
