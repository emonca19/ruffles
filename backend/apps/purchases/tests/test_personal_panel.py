from django.urls import reverse

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.purchases.models import Purchase
from apps.raffles.models import Raffle


@pytest.mark.django_db
class TestPersonalPanel:
    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def raffle(self, db):
        organizer = User.objects.create_user(
            email="org@example.com",
            password="password",
            user_type=User.UserType.ORGANIZER,
        )
        return Raffle.objects.create(
            name="Test Raffle",
            number_start=1,
            number_end=100,
            price_per_number=10.00,
            sale_start_at="2024-01-01T00:00:00Z",
            sale_end_at="2025-01-01T00:00:00Z",
            draw_scheduled_at="2025-01-02T00:00:00Z",
            organizer=organizer,
        )

    @pytest.fixture
    def guest_purchase(self, raffle):
        purchase = Purchase.objects.create(
            raffle=raffle,
            guest_name="Guest User",
            guest_phone="1234567890",
            guest_email="guest@example.com",
            total_amount=20.00,
            status=Purchase.Status.PENDING,
        )
        return purchase

    @pytest.fixture
    def customer_purchase(self, raffle):
        customer = User.objects.create_user(
            email="customer@example.com",
            password="password",
            user_type=User.UserType.CUSTOMER,
        )
        purchase = Purchase.objects.create(
            raffle=raffle,
            customer=customer,
            total_amount=30.00,
            status=Purchase.Status.PAID,
        )
        return purchase, customer

    def test_guest_list_purchases_success(self, api_client, guest_purchase):
        """Valid phone number returns associated purchases for guest."""
        url = reverse("purchase-list")
        response = api_client.get(url, {"phone": "1234567890"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == guest_purchase.id
        assert response.data[0]["status"] == "pending"
        assert "raffle_image" in response.data[0]

    def test_guest_list_purchases_no_phone_error(self, api_client):
        """Missing phone param returns 400 for unauthenticated user."""
        url = reverse("purchase-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_guest_list_purchases_invalid_phone_format(self, api_client):
        """Invalid phone format returns 400."""
        url = reverse("purchase-list")
        response = api_client.get(url, {"phone": "123"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_guest_list_purchases_empty(self, api_client):
        """Valid phone number with no history returns empty list."""
        url = reverse("purchase-list")
        response = api_client.get(url, {"phone": "0000000000"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_guest_cannot_see_others_purchases(self, api_client, guest_purchase):
        """Phone A does not show purchases for Phone B."""
        url = reverse("purchase-list")
        # guest_purchase has phone 1234567890
        response = api_client.get(url, {"phone": "0987654321"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_organizer_list_own_purchases(self, api_client, customer_purchase):
        """Authenticated user sees own purchases without phone param."""
        purchase, customer = customer_purchase
        api_client.force_authenticate(user=customer)

        url = reverse("purchase-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == purchase.id

    def test_organizer_list_guest_purchases(self, api_client, guest_purchase):
        """Authenticated user can look up guest purchases by phone."""
        organizer = User.objects.create_user(
            email="admin@example.com",
            password="password",
            user_type=User.UserType.ORGANIZER,
        )
        api_client.force_authenticate(user=organizer)

        url = reverse("purchase-list")
        response = api_client.get(url, {"phone": "1234567890"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == guest_purchase.id
