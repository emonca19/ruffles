from __future__ import annotations

from django.contrib.auth import get_user_model
from django.urls import reverse

import pytest
from rest_framework import status
from rest_framework.test import APIClient

# Este archivo contiene tests para el endpoint de registro (auth-register).
# Cada función de test tiene una pequeña docstring en español que explica
# qué prueba realiza y por qué, junto con comentarios inline que aclaran
# la sintaxis usada (por ejemplo, fixtures, reverse(), format="json").
pytestmark = pytest.mark.django_db


def test_registration_success_returns_tokens_and_user(api_client: APIClient) -> None:
    """Verifica el flujo feliz de registro.

    - Envía un POST a la ruta nombrada "auth-register" con JSON.
    - Espera 201 y que la respuesta contenga: user, access y refresh.
    - Comprueba que el usuario se guardó con email normalizado a minúsculas.

    Notas sobre sintaxis:
    - `api_client` es un fixture que provee `rest_framework.test.APIClient`.
    - `reverse("auth-register")` resuelve el nombre de la ruta a la URL.
    - `format="json"` indica al cliente de test que envie JSON.
    """
    data = {"name": "Alice", "email": "Alice@Example.COM", "password": "SecurePass123!"}
    # Enviamos la petición; reverse() obtiene la URL usando el name de la ruta
    resp = api_client.post(reverse("auth-register"), data, format="json")
    assert resp.status_code == status.HTTP_201_CREATED

    # Comprobamos la forma básica de la respuesta (token + user)
    assert set(resp.data.keys()) == {"user", "access", "refresh"}
    assert isinstance(resp.data["access"], str)
    assert isinstance(resp.data["refresh"], str)

    # Verificamos en la DB que el email se guardó en minúsculas
    User = get_user_model()
    user = User.objects.get(email="alice@example.com")  # normalizado a minúsculas
    assert resp.data["user"]["id"] == user.id
    assert resp.data["user"]["email"] == "alice@example.com"
    assert resp.data["user"]["name"] == "Alice"
    assert "date_joined" in resp.data["user"]
    assert "updated_at" in resp.data["user"]
    # Importante: no debe devolverse la contraseña en la respuesta
    assert "password" not in resp.data["user"]


def test_registration_duplicate_email_case_insensitive(
    api_client: APIClient, user_factory
) -> None:
    """El registro debe fallar si el email ya existe, sin importar mayúsculas/minúsculas.

    - Creamos un usuario con `user_factory` (fixture de fábrica).
    - Intentamos registrar con una variante en mayúsculas del email.
    - Esperamos 400 y que la clave 'email' esté presente en los errores.
    """
    user_factory(email="bob@example.com", password="Other123!", name="Bob")
    data = {"name": "Bob", "email": "BOB@example.com", "password": "Other123!"}
    resp = api_client.post(reverse("auth-register"), data, format="json")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "email" in resp.data


@pytest.mark.parametrize(
    "payload, missing_field",
    [
        ({"email": "charlie@example.com", "password": "Strong123!"}, "name"),
        ({"name": "Charlie", "password": "Strong123!"}, "email"),
        ({"name": "Charlie", "email": "charlie@example.com"}, "password"),
        ({}, None),
    ],
)
def test_registration_missing_fields(
    api_client: APIClient, payload: dict, missing_field: str | None
) -> None:
    """Parametriza distintos payloads con campos faltantes.

    - `pytest.mark.parametrize` permite ejecutar el mismo test con varios inputs.
    - `missing_field` indica qué clave de error esperamos en la respuesta.
    """
    resp = api_client.post(reverse("auth-register"), payload, format="json")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    if missing_field:
        # Si falta un campo concreto, debe aparecer en el dict de errores
        assert missing_field in resp.data
    else:
        # Si no enviamos nada, esperamos algún error (non-empty dict)
        assert isinstance(resp.data, dict) and resp.data  # el error debe existir


@pytest.mark.parametrize(
    "email",
    ["plainaddress", "@missinguser.com", "john@", "john@.com", "john.com"],
)
def test_registration_invalid_email(api_client: APIClient, email: str) -> None:
    """Valida varios formatos de email inválidos.

    - El parametrize ejecuta este test para cada email inválido.
    - Se espera un 400 y que la clave 'email' aparezca en los errores.
    """
    data = {"name": "John", "email": email, "password": "Valid123!"}
    resp = api_client.post(reverse("auth-register"), data, format="json")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "email" in resp.data


@pytest.mark.parametrize("password", ["short", "1234567"])
def test_registration_password_too_short(api_client: APIClient, password: str) -> None:
    """Comprueba que contraseñas demasiado cortas sean rechazadas.

    - `parametrize` cubre varios ejemplos de passwords inválidos.
    - Se espera 400 y que la clave 'password' esté en resp.data.
    """
    data = {"name": "Dave", "email": "dave@example.com", "password": password}
    resp = api_client.post(reverse("auth-register"), data, format="json")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "password" in resp.data


def test_registration_rejects_admin_flags_and_does_not_escalate_privileges(
    api_client: APIClient,
) -> None:
    """Asegura que los flags administrativos enviados por el cliente no escalen privilegios.

    - Si el endpoint rechaza campos administrativos, puede devolver 400.
    - Si crea el usuario (201), entonces los flags no deben haberse aplicado.
    """
    data = {
        "name": "EvilAdmin",
        "email": "eviladmin@example.com",
        "password": "RootPass123!",
        "is_staff": True,
        "is_superuser": True,
    }
    resp = api_client.post(reverse("auth-register"), data, format="json")
    User = get_user_model()
    # Comprobamos en la base de datos que no se elevó a superuser
    elevated = User.objects.filter(
        email="eviladmin@example.com", is_superuser=True
    ).exists()
    assert resp.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_201_CREATED)
    assert not elevated


def test_registration_cannot_create_organizer_without_auth(
    api_client: APIClient,
) -> None:
    """Verifica que no se pueda crear un usuario con rol 'organizer' sin autorización.

    - Dependiendo de la implementación, el error puede estar en 'user_type' o en 'non_field_errors'.
    """
    data = {
        "name": "Org Wannabe",
        "email": "wannabe@example.com",
        "password": "ValidPass123!",
        "user_type": "organizer",
    }
    resp = api_client.post(reverse("auth-register"), data, format="json")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "user_type" in resp.data or "non_field_errors" in resp.data


def test_registration_accepts_optional_phone(api_client: APIClient) -> None:
    """Comprueba que el campo opcional `phone` se acepta y se devuelve en el user.

    - No valida el formato del teléfono aquí; solo revisa que se guarde y se devuelva.
    """
    data = {
        "name": "Phoebe",
        "email": "phoebe@example.com",
        "password": "ValidPass123!",
        "phone": "+1 (555) 555-5555",
    }
    resp = api_client.post(reverse("auth-register"), data, format="json")
    assert resp.status_code == status.HTTP_201_CREATED
    assert resp.data["user"]["phone"] == "+1 (555) 555-5555"
