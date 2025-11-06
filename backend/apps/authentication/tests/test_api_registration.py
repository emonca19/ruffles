import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User
pytestmark = pytest.mark.django_db

# Happy path: successful registration
def test_registration_success():
    client = APIClient()
    data = {
        "name": "Alice",
        "email": "alice@example.com",
        "password": "SecurePass123!"
    }
    response = client.post(reverse("auth-register"), data)
    assert response.status_code == 201
    assert User.objects.filter(email="alice@example.com").exists()
    assert "id" in response.data or "message" in response.data

# Registration fails when email already registered
def test_registration_duplicate_email(user_factory):
    user_factory(email="bob@example.com", password="Other123!", name="Bob")
    client = APIClient()
    data = {"name": "Bob", "email": "bob@example.com", "password": "Other123!"}
    resp = client.post(reverse("auth-register"), data)
    assert resp.status_code == 400
    assert "email" in resp.data or "already" in str(resp.data).lower()

# Registration fails for missing required fields
@pytest.mark.parametrize("data", [
    {"email": "charlie@example.com", "password": "Strong123!"},  # Missing name
    {"name": "Charlie", "password": "Strong123!"},  # Missing email
    {"name": "Charlie", "email": "charlie@example.com"},  # Missing password
    {},  # All missing
])
def test_registration_missing_fields(data):
    client = APIClient()
    response = client.post(reverse("auth-register"), data)
    assert response.status_code == 400
    assert "error" in response.data or "field" in str(response.data).lower()

# Registration fails with invalid email format
@pytest.mark.parametrize("email", [
    "plainaddress", "@missinguser.com", "john@", "john@.com", "john.com"
])
def test_registration_invalid_email(email):
    client = APIClient()
    data = {"name": "John", "email": email, "password": "Valid123!"}
    response = client.post(reverse("auth-register"), data)
    assert response.status_code == 400
    assert "email" in response.data or "invalid" in str(response.data).lower()

# Registration fails when password does not meet complexity
@pytest.mark.parametrize("password", [
    "short", "123456789", "password", "Aa123"
])
def test_registration_weak_password(password):
    client = APIClient()
    data = {"name": "Dave", "email": "dave@example.com", "password": password}
    response = client.post(reverse("auth-register"), data)
    assert response.status_code == 400
    assert "password" in response.data or "too weak" in str(response.data).lower()

# Registration ignores extra/unexpected fields (should not crash)
def test_registration_extra_fields_are_ignored():
    client = APIClient()
    data = {
        "name": "Emily",
        "email": "emily@example.com",
        "password": "EmilyPass123!",
        "random": "value",
        "foo": 42
    }
    response = client.post(reverse("auth-register"), data)
    assert response.status_code in (201, 200, 400)  # Depending on your logic
    # If success, user should be created; if failure, should be a clean error

# Registration as admin (if public/admin registration allowed)
def test_registration_admin_role_denied():
    client = APIClient()
    data = {
        "name": "EvilAdmin",
        "email": "eviladmin@example.com",
        "password": "RootPass123!",
        "is_staff": True,
        "is_superuser": True
    }
    response = client.post(reverse("auth-register"), data)
    # Should ignore or reject attempts to set protected fields
    assert response.status_code in (201, 400, 403)
    assert not User.objects.filter(email="eviladmin@example.com", is_superuser=True).exists()
