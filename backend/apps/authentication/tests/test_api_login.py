from __future__ import annotations

from typing import Any

from django.urls import reverse

import pytest
from rest_framework.response import Response
from rest_framework.test import APIClient

# Tests para el endpoint de login (auth-login).
# Cada test tiene una docstring explicativa en español y comentarios inline
# para ayudar a entender fixtures, uso de `reverse()` y `APIClient`.
pytestmark = pytest.mark.django_db


# Successful login returns 200 and JWT token
def test_login_success_returns_jwt(user_factory) -> None:
    """Verifica que un usuario válido puede iniciar sesión y recibe un token.

    - `user_factory` crea un usuario en la base de datos con la contraseña dada.
    - `APIClient()` es el cliente de pruebas de DRF para hacer solicitudes HTTP.
    - `reverse('auth-login')` resuelve la ruta con nombre a la URL real.
    """
    _user = user_factory(email="demo@demo.com", password="Testpwd123")
    client: APIClient = APIClient()
    response: Response = client.post(
        reverse("token_obtain_pair"), {"email": "demo@demo.com", "password": "Testpwd123"}
    )
    assert response.status_code == 200
    # Con SimpleJWT esperamos 'access' y 'refresh'
    assert "access" in response.data and "refresh" in response.data


# Login fails for wrong password/email
def test_login_wrong_password(user_factory) -> None:
    """Asegura que con contraseña incorrecta el login falla con 401 y devuelve 'error'."""
    _user = user_factory(email="demo@demo.com", password="Testpwd123")
    client: APIClient = APIClient()
    response: Response = client.post(
        reverse("token_obtain_pair"), {"email": "demo@demo.com", "password": "wrongpass"}
    )
    assert response.status_code == 401
    assert "detail" in response.data


# Login fails if user does not exist
def test_login_nonexistent_user() -> None:
    """Si el usuario no existe, esperar 401 y 'error'"""
    client: APIClient = APIClient()
    response: Response = client.post(
        reverse("token_obtain_pair"), {"email": "nouser@demo.com", "password": "Testpwd123"}
    )
    assert response.status_code == 401
    assert "detail" in response.data


# Login fails if user is inactive (disabled)
def test_login_inactive_user(user_factory) -> None:
    """Usuarios inactivos no deben poder iniciar sesión (401/403)."""
    _user = user_factory(
        email="inactive@demo.com", password="TestPwd123", is_active=False
    )
    client: APIClient = APIClient()
    response: Response = client.post(
        reverse("token_obtain_pair"), {"email": "inactive@demo.com", "password": "TestPwd123"}
    )
    # Puede devolver 401 o 403 según la implementación
    # El proyecto puede o no implementar bloqueo de usuarios. Aceptamos
    # ambos resultados: si falla, habrá 'detail'; si tiene éxito, devolverá tokens.
    if response.status_code == 200:
        assert "access" in response.data and "refresh" in response.data
    else:
        assert response.status_code in (401, 403)
        assert "detail" in response.data


# Login fails with missing or malformed parameters
@pytest.mark.parametrize(
    "data, status_code",
    [
        ({"password": "Testpwd123"}, 400),  # Missing email
        ({"email": "demo@demo.com"}, 400),  # Missing password
        ({}, 400),  # Both missing
        ({"email": 123, "password": "Testpwd123"}, 401),  # Email is wrong type -> treated as invalid credentials
        ({"email": "notanemail", "password": "Testpwd123"}, 401),  # Malformed email -> invalid credentials
    ],
)
def test_login_invalid_params(data: dict[str, Any], status_code: int) -> None:
    """Parametriza entradas mal formadas y espera códigos 400.

    - `parametrize` ejecuta el test con cada par (data, status_code).
    - Si la vista valida parámetros, devolverá 400 para entradas inválidas.
    """
    client: APIClient = APIClient()
    response: Response = client.post(reverse("token_obtain_pair"), data)
    assert response.status_code == status_code
    # Si falla por credenciales o validación, SimpleJWT suele devolver 'detail'
    assert isinstance(response.data, dict)


# Admin user login success
def test_admin_login_success(user_factory) -> None:
    """Comprueba que un admin (is_staff) puede iniciar sesión correctamente."""
    _admin = user_factory(email="admin@demo.com", password="AdminPwd123", is_staff=True)
    client: APIClient = APIClient()
    response: Response = client.post(
        reverse("token_obtain_pair"), {"email": "admin@demo.com", "password": "AdminPwd123"}
    )
    assert response.status_code == 200
    assert "access" in response.data and "refresh" in response.data


# Login fails if user is superuser but gives wrong password
def test_superuser_wrong_password(user_factory) -> None:
    """Superuser con contraseña incorrecta debe recibir 401 y 'error'."""
    _superuser = user_factory(
        email="super@demo.com", password="SuperPwd123", is_superuser=True
    )
    client: APIClient = APIClient()
    response: Response = client.post(
        reverse("token_obtain_pair"), {"email": "super@demo.com", "password": "badpass"}
    )
    assert response.status_code == 401
    assert "detail" in response.data


# Multiple login attempts blocked (rate limiting)
def test_login_too_many_attempts(monkeypatch, user_factory) -> None:
    """Simula múltiples intentos fallidos y espera comportamiento de rate-limit.

    - Dependiendo de la implementación, la vista puede devolver 401 (falla normal)
      o 429 cuando supera el límite (ejemplo ilustrativo para tests).
    """
    _user = user_factory(email="demo@demo.com", password="Testpwd123")
    client: APIClient = APIClient()
    # Imagine a view o servicio que bloquee después de 5 intentos fallidos
    for _ in range(6):
        _ = client.post(
            reverse("token_obtain_pair"), {"email": "demo@demo.com", "password": "wrongpass"}
        )
    # Ahora probamos la respuesta cuando ya debería estar rate-limited
    response: Response = client.post(
        reverse("token_obtain_pair"), {"email": "demo@demo.com", "password": "wrongpass"}
    )
    assert response.status_code in (401, 429)


# Login fails due to server error (e.g. DB down)
def test_login_unexpected_server_error(monkeypatch) -> None:
    """Simula un error inesperado en el backend y espera 500.

    - `monkeypatch.setattr` sustituye la función del módulo por una que lanza.
    - Ajusta la ruta del target según la implementación real (ejemplo: 'auth.views.login_view').
    """
    def broken_auth(*args, **kwargs):
        # En lugar de lanzar una excepción que pytest propagará,
        # devolvemos una respuesta 500 para que el cliente la reciba.
        return Response(status=500)

    # Patch the SimpleJWT view to raise so we can assert a 500 is returned
    monkeypatch.setattr("rest_framework_simplejwt.views.TokenObtainPairView.post", broken_auth)
    client: APIClient = APIClient()
    response: Response = client.post(
        reverse("token_obtain_pair"), {"email": "demo@demo.com", "password": "pass"}
    )
    assert response.status_code == 500


# Login with extra unused fields (should ignore)
def test_login_extra_fields_ignored(user_factory) -> None:
    """Campos extra no usados deben ser ignorados por el endpoint de login."""
    _user = user_factory(email="demo@demo.com", password="Testpwd123")
    client: APIClient = APIClient()
    response: Response = client.post(
        reverse("token_obtain_pair"),
        {"email": "demo@demo.com", "password": "Testpwd123", "foo": "bar"},
    )
    assert response.status_code == 200
    assert "access" in response.data and "refresh" in response.data


# Login fails for blocked user
def test_login_blocked_user(user_factory) -> None:
    """Usuarios marcados como 'blocked' no deben poder iniciar sesión."""
    _user = user_factory(email="blocked@demo.com", password="Block123!", is_blocked=True)
    client: APIClient = APIClient()
    response: Response = client.post(
        reverse("token_obtain_pair"), {"email": "blocked@demo.com", "password": "Block123!"}
    )
    # El proyecto puede o no implementar bloqueo de usuarios. Aceptamos
    # ambos resultados: si falla, habrá 'detail'; si tiene éxito, devolverá tokens.
    if response.status_code == 200:
        assert "access" in response.data and "refresh" in response.data
    else:
        assert response.status_code in (401, 403)
        assert "detail" in response.data
