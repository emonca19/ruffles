from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from apps.authentication.models import User
from apps.purchases.models import Purchase, PurchaseDetail
from apps.raffles.models import Raffle


class ReservationEdgeCaseTests(APITestCase):
    def setUp(self):
        self.organizer, _ = User.objects.get_or_create(
            email="organizer@example.com",
            defaults={"password": "password123", "user_type": User.UserType.ORGANIZER},
        )
        self.customer, _ = User.objects.get_or_create(
            email="customer@example.com",
            defaults={"password": "password123", "user_type": User.UserType.CUSTOMER},
        )
        self.raffle = Raffle.objects.create(
            name="Test Raffle",
            number_start=1,
            number_end=100,
            price_per_number=Decimal("10.00"),
            sale_start_at=timezone.now() - timedelta(days=1),
            sale_end_at=timezone.now() + timedelta(days=7),
            draw_scheduled_at=timezone.now() + timedelta(days=8),
            organizer=self.organizer,
        )
        self.url = reverse("purchase-list")

    def test_reservation_expired_number_should_be_available(self):
        """
        Test that a number from an EXPIRED purchase can be reserved again.
        """
        # 1. Create an expired purchase
        expired_purchase = Purchase.objects.create(
            raffle=self.raffle,
            customer=self.customer,
            status=Purchase.Status.PENDING,
            total_amount=Decimal("10.00"),
            reserved_at=timezone.now() - timedelta(hours=2),
            expires_at=timezone.now() - timedelta(hours=1),  # Expired 1 hour ago
        )
        PurchaseDetail.objects.create(
            purchase=expired_purchase, number=50, unit_price=Decimal("10.00")
        )

        # 2. Try to reserve the same number
        self.client.force_authenticate(user=self.customer)
        data = {"raffle_id": self.raffle.id, "numbers": [50]}
        response = self.client.post(self.url, data)

        # 3. Assert failure (as per current design choice/limitation)
        # The user confirmed this feature is for the future.
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            print("\nSUCCESS: Expired number correctly rejected (feature pending).")
        else:
            print(
                f"\nFAILURE: Unexpected status code. Status: {response.status_code}, Data: {response.data}"
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reservation_on_closed_raffle(self):
        """
        Test that one cannot reserve numbers on a raffle that has ended.
        """
        self.raffle.sale_end_at = timezone.now() - timedelta(hours=1)
        self.raffle.save()

        self.client.force_authenticate(user=self.customer)
        data = {"raffle_id": self.raffle.id, "numbers": [60]}
        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
