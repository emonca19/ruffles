from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone

import pytest
from rest_framework import status

from apps.purchases.models import Purchase, PurchaseDetail
from apps.raffles.models import Raffle


@pytest.fixture
def raffle(db, organizer_user):
    return Raffle.objects.create(
        name="Test Raffle",
        number_start=1,
        number_end=100,
        price_per_number=Decimal("10.00"),
        sale_start_at=timezone.now(),
        sale_end_at=timezone.now() + timedelta(days=7),
        draw_scheduled_at=timezone.now() + timedelta(days=8),
        organizer=organizer_user,
    )


@pytest.fixture
def purchase_factory(db):
    def create_purchase(
        raffle, status=Purchase.Status.PENDING, customer=None, **kwargs
    ):
        purchase = Purchase.objects.create(
            raffle=raffle,
            status=status,
            customer=customer,
            total_amount=Decimal("100.00"),
            **kwargs,
        )
        return purchase

    return create_purchase


@pytest.mark.django_db
class TestRaffleManifest:
    def test_organizer_can_view_manifest(
        self, api_client, organizer_user, raffle, purchase_factory
    ):
        """
        An organizer should be able to see the manifest of their raffle.
        """
        # Create some purchases for this raffle
        purchase1 = purchase_factory(
            raffle=raffle,
            status=Purchase.Status.PAID,
            customer=None,
            guest_name="Guest 1",
            guest_phone="1234567890",
        )
        PurchaseDetail.objects.create(purchase=purchase1, number=5, unit_price=100)

        purchase2 = purchase_factory(
            raffle=raffle, status=Purchase.Status.PENDING, customer=organizer_user
        )  # Organizer buying their own ticket
        PurchaseDetail.objects.create(purchase=purchase2, number=10, unit_price=100)

        api_client.force_authenticate(user=organizer_user)
        url = reverse("raffle-manifest", kwargs={"pk": raffle.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.data

        # We expect 2 items
        assert len(data) == 2

        # Check content of first item (number 5)
        item1 = next(d for d in data if d["number"] == 5)
        assert item1["status"] == "paid"
        assert item1["customer_name"] == "Guest 1"
        assert item1["customer_phone"] == "1234567890"

        # Check content of second item (number 10)
        item2 = next(d for d in data if d["number"] == 10)
        assert item2["status"] == "pending"
        # Assuming the serializer resolves the user's name correctly
        # The user factory creates a user with name="Test User" or similar if not specified,
        # but organizer_user has name="Organizer".
        assert item2["customer_email"] == organizer_user.email

    def test_client_cannot_view_manifest(self, api_client, user_factory, raffle):
        """
        A regular client should NOT be able to see the manifest.
        """
        user = user_factory()
        api_client.force_authenticate(user=user)
        url = reverse("raffle-manifest", kwargs={"pk": raffle.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_guest_cannot_view_manifest(self, api_client, raffle):
        """
        A guest (unauthenticated) should NOT be able to see the manifest.
        """
        url = reverse("raffle-manifest", kwargs={"pk": raffle.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_manifest_only_shows_taken_numbers(
        self, api_client, organizer_user, raffle
    ):
        """
        The manifest should only return numbers that are actually taken (PurchaseDetail exists).
        """
        api_client.force_authenticate(user=organizer_user)
        url = reverse("raffle-manifest", kwargs={"pk": raffle.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0  # No purchases yet
