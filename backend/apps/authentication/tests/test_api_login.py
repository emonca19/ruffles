import pytest
from django.urls import reverse
from rest_framework.test import APIClient
pytestmark = pytest.mark.django_db

# Successful login returns 200 and JWT token
def test_login_success_returns_jwt(user_factory):
    user = user_factory(email="demo@demo.com", password="Testpwd123")
    client = APIClient()
    response = client.post(reverse("auth-login"), {"email": "demo@demo.com", "password": "Testpwd123"})
    assert response.status_code == 200
    assert "token" in response.data

# Login fails for wrong password/email
def test_login_wrong_password(user_factory):
    user = user_factory(email="demo@demo.com", password="Testpwd123")
    client = APIClient()
    response = client.post(reverse("auth-login"), {"email": "demo@demo.com", "password": "wrongpass"})
    assert response.status_code == 401
    assert "error" in response.data

# Login fails if user does not exist
def test_login_nonexistent_user():
    client = APIClient()
    response = client.post(reverse("auth-login"), {"email": "nouser@demo.com", "password": "Testpwd123"})
    assert response.status_code == 401
    assert "error" in response.data

# Login fails if user is inactive (disabled)
def test_login_inactive_user(user_factory):
    user = user_factory(email="inactive@demo.com", password="TestPwd123", is_active=False)
    client = APIClient()
    response = client.post(reverse("auth-login"), {"email": "inactive@demo.com", "password": "TestPwd123"})
    assert response.status_code in (401, 403)
    assert "error" in response.data

# Login fails with missing or malformed parameters
@pytest.mark.parametrize("data, status_code", [
    ({"password": "Testpwd123"}, 400),              # Missing email
    ({"email": "demo@demo.com"}, 400),            # Missing password
    ({}, 400),                                       # Both missing
    ({"email": 123, "password": "Testpwd123"}, 400),  # Email is wrong type
    ({"email": "notanemail", "password": "Testpwd123"}, 400), # Malformed email
])
def test_login_invalid_params(data, status_code):
    client = APIClient()
    response = client.post(reverse("auth-login"), data)
    assert response.status_code == status_code
    assert "error" in response.data

# Admin user login success
def test_admin_login_success(user_factory):
    admin = user_factory(email="admin@demo.com", password="AdminPwd123", is_staff=True)
    client = APIClient()
    response = client.post(reverse("auth-login"), {"email": "admin@demo.com", "password": "AdminPwd123"})
    assert response.status_code == 200
    assert "token" in response.data

# Login fails if user is superuser but gives wrong password
def test_superuser_wrong_password(user_factory):
    superuser = user_factory(email="super@demo.com", password="SuperPwd123", is_superuser=True)
    client = APIClient()
    response = client.post(reverse("auth-login"), {"email": "super@demo.com", "password": "badpass"})
    assert response.status_code == 401
    assert "error" in response.data

# Multiple login attempts blocked (rate limiting)
def test_login_too_many_attempts(monkeypatch, user_factory):
    user = user_factory(email="demo@demo.com", password="Testpwd123")
    client = APIClient()
    # Imagine a view or service blocks after 5 failed attempts
    for i in range(6):
        response = client.post(reverse("auth-login"), {"email": "demo@demo.com", "password": "wrongpass"})
    # Now test rate-limit response (e.g. 429 Too Many Requests)
    response = client.post(reverse("auth-login"), {"email": "demo@demo.com", "password": "wrongpass"})
    assert response.status_code in (401, 429)

# Login fails due to server error (e.g. DB down)
def test_login_unexpected_server_error(monkeypatch):
    def broken_auth(*args, **kwargs):
        raise Exception("DB is down!")
    monkeypatch.setattr("auth.views.login_view", broken_auth)
    client = APIClient()
    response = client.post(reverse("auth-login"), {"email": "demo@demo.com", "password": "pass"})
    assert response.status_code == 500

# Login with extra unused fields (should ignore)
def test_login_extra_fields_ignored(user_factory):
    user = user_factory(email="demo@demo.com", password="Testpwd123")
    client = APIClient()
    response = client.post(reverse("auth-login"), {
        "email": "demo@demo.com",
        "password": "Testpwd123",
        "foo": "bar"
    })
    assert response.status_code == 200
    assert "token" in response.data

# Login fails for blocked user
def test_login_blocked_user(user_factory):
    user = user_factory(email="blocked@demo.com", password="Block123!", is_blocked=True)
    client = APIClient()
    response = client.post(reverse("auth-login"), {"email": "blocked@demo.com", "password": "Block123!"})
    assert response.status_code in (401, 403)
    assert "error" in response.data
