from __future__ import annotations

from typing import Any

from django.urls import reverse
import pytest
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient

from apps.raffles.models import Raffle


@pytest.mark.django_db
class TestCreateRaffle:
    def test_post_requires_authentication(self, api_client: APIClient) -> None:
        """An unauthenticated user cannot create a raffle (401)."""
        url = reverse("organizer-raffle-list")
        payload = {"name": "T1"}
        resp: Response = api_client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_minimal_valid_raffle(self, organizer_user: Any, api_client_with_token) -> None:
        """Create a minimal valid raffle (201) and ensure organizer/created_by are assigned."""
        client: APIClient = api_client_with_token(organizer_user)
        url = reverse("organizer-raffle-list")
        payload = {
            "name": "Mi Sorteo",
            "number_start": 1,
            "number_end": 100,
            "price_per_number": "10.00",
            "sale_start_at": "2025-01-01T00:00:00Z",
            "sale_end_at": "2025-12-31T23:59:59Z",
            "draw_scheduled_at": "2026-01-01T00:00:00Z",
        }

        resp: Response = client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        data = resp.data
        assert data["name"] == "Mi Sorteo"
        r = Raffle.objects.get(id=data["id"])  # type: ignore[arg-type]
        assert r.organizer_id == organizer_user.id
        assert r.created_by_id == organizer_user.id

    def test_create_missing_required_fields_returns_400(self, organizer_user: Any, api_client_with_token) -> None:
        """Missing required fields should return 400 with error details."""
        client: APIClient = api_client_with_token(organizer_user)
        url = reverse("organizer-raffle-list")
        payload = {"name": "Bad"}
        resp: Response = client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert any(k in resp.data for k in ("number_start", "number_end", "price_per_number", "sale_start_at"))

    def test_creator_is_request_user(self, api_client_with_token, user_factory) -> None:
        """If the payload contains another user, the organizer must be the authenticated user."""
        other = user_factory(email="other@example.com")
        client_user = user_factory(email="client@example.com")
        client: APIClient = api_client_with_token(client_user)
        url = reverse("organizer-raffle-list")
        payload = {
            "name": "Intentar falsificar organizer",
            "number_start": 1,
            "number_end": 10,
            "price_per_number": "1.00",
            "sale_start_at": "2025-01-01T00:00:00Z",
            "sale_end_at": "2025-01-02T00:00:00Z",
            "draw_scheduled_at": "2025-02-01T00:00:00Z",
            "organizer": other.id,
            "created_by": other.id,
        }
        resp: Response = client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        data = resp.data
        r = Raffle.objects.get(id=data["id"])  # type: ignore[arg-type]
        assert r.organizer_id == client_user.id
        assert r.created_by_id == client_user.id

    def test_validation_error_number_range(self, organizer_user: Any, api_client_with_token) -> None:
        """number_start >= number_end should produce a validation error (400)."""
        client: APIClient = api_client_with_token(organizer_user)
        url = reverse("organizer-raffle-list")
        payload = {
            "name": "Invalid range",
            "number_start": 10,
            "number_end": 1,
            "price_per_number": "5.00",
            "sale_start_at": "2025-01-01T00:00:00Z",
            "sale_end_at": "2025-02-01T00:00:00Z",
            "draw_scheduled_at": "2025-03-01T00:00:00Z",
        }
        resp: Response = client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "number_end" in resp.data

    def test_price_must_be_non_negative(self, organizer_user: Any, api_client_with_token) -> None:
        """Negative price_per_number should return 400 and include an error for price_per_number."""
        client: APIClient = api_client_with_token(organizer_user)
        url = reverse("organizer-raffle-list")
        payload = {
            "name": "Negative price",
            "number_start": 1,
            "number_end": 10,
            "price_per_number": "-1.00",
            "sale_start_at": "2025-01-01T00:00:00Z",
            "sale_end_at": "2025-01-02T00:00:00Z",
            "draw_scheduled_at": "2025-02-01T00:00:00Z",
        }
        resp: Response = client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "price_per_number" in resp.data

    def test_sale_window_validation(self, organizer_user: Any, api_client_with_token) -> None:
        """sale_start_at >= sale_end_at should return 400 with error on sale_end_at."""
        client: APIClient = api_client_with_token(organizer_user)
        url = reverse("organizer-raffle-list")
        payload = {
            "name": "Bad sale window",
            "number_start": 1,
            "number_end": 10,
            "price_per_number": "2.00",
            "sale_start_at": "2025-02-01T00:00:00Z",
            "sale_end_at": "2025-01-01T00:00:00Z",
            "draw_scheduled_at": "2025-03-01T00:00:00Z",
        }
        resp: Response = client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "sale_end_at" in resp.data

    def test_draw_must_be_after_sale_end(self, organizer_user: Any, api_client_with_token) -> None:
        """draw_scheduled_at must be after sale_end_at; otherwise return 400 with error on draw_scheduled_at."""
        client: APIClient = api_client_with_token(organizer_user)
        url = reverse("organizer-raffle-list")
        payload = {
            "name": "Draw too early",
            "number_start": 1,
            "number_end": 10,
            "price_per_number": "3.00",
            "sale_start_at": "2025-01-01T00:00:00Z",
            "sale_end_at": "2025-02-01T00:00:00Z",
            "draw_scheduled_at": "2025-01-15T00:00:00Z",
        }
        resp: Response = client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "draw_scheduled_at" in resp.data

    def test_winner_number_out_of_range_returns_400(self, organizer_user: Any, api_client_with_token) -> None:
        """If winner_number is provided and out of the configured range, return 400 with error on winner_number."""
        client: APIClient = api_client_with_token(organizer_user)
        url = reverse("organizer-raffle-list")
        payload = {
            "name": "Winner out of range",
            "number_start": 1,
            "number_end": 10,
            "price_per_number": "4.00",
            "sale_start_at": "2025-01-01T00:00:00Z",
            "sale_end_at": "2025-02-01T00:00:00Z",
            "draw_scheduled_at": "2025-03-01T00:00:00Z",
            "winner_number": 999,
        }
        resp: Response = client.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "winner_number" in resp.data
