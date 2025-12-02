from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from apps.authentication.models import User
from apps.purchases.models import Purchase
from apps.raffles.models import Raffle


class ReservationTests(APITestCase):
    def setUp(self):
        # Create Organizer
        self.organizer, _ = User.objects.get_or_create(
            email="organizer@example.com",
            defaults={"password": "password123", "user_type": User.UserType.ORGANIZER},
        )

        # Create Customer
        self.customer, _ = User.objects.get_or_create(
            email="customer@example.com",
            defaults={"password": "password123", "user_type": User.UserType.CUSTOMER},
        )

        # Create Raffle
        self.raffle = Raffle.objects.create(
            name="Test Raffle",
            number_start=1,
            number_end=100,
            price_per_number=Decimal("10.00"),
            sale_start_at=timezone.now(),
            sale_end_at=timezone.now() + timedelta(days=7),
            draw_scheduled_at=timezone.now() + timedelta(days=8),
            organizer=self.organizer,
        )

        self.url = reverse(
            "purchase-list"
        )  # We'll need to ensure this URL name exists or use explicit path

    def test_reservation_authenticated_success(self):
        """
        Test 1: Authenticated user can reserve numbers.
        """
        self.client.force_authenticate(user=self.customer)
        data = {"raffle_id": self.raffle.id, "numbers": [10, 11]}  # type: ignore
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        purchase = Purchase.objects.get(id=response.data["id"])
        self.assertEqual(purchase.customer, self.customer)
        self.assertEqual(purchase.details.count(), 2)  # type: ignore
        self.assertEqual(purchase.total_amount, Decimal("20.00"))

    def test_reservation_guest_success(self):
        """
        Test 2: Guest can reserve numbers with guest details.
        """
        data = {
            "raffle_id": self.raffle.id,  # type: ignore
            "numbers": [20, 21],
            "guest_name": "Guest User",
            "guest_phone": "1234567890",
            "guest_email": "guest@example.com",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        purchase = Purchase.objects.get(id=response.data["id"])
        self.assertIsNone(purchase.customer)
        self.assertEqual(purchase.guest_phone, "1234567890")
        self.assertEqual(purchase.details.count(), 2)  # type: ignore

    def test_reservation_numbers_already_taken(self):
        """
        Test 3: Cannot reserve numbers that are already taken.
        """
        # First purchase
        self.client.force_authenticate(user=self.customer)
        self.client.post(self.url, {"raffle_id": self.raffle.id, "numbers": [10]})  # type: ignore

        # Second purchase attempt for same number
        data = {"raffle_id": self.raffle.id, "numbers": [10, 12]}  # type: ignore
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("available", str(response.data))

    def test_reservation_guest_info_missing(self):
        """
        Test 4: Guest must provide details.
        """
        data = {
            "raffle_id": self.raffle.id,  # type: ignore
            "numbers": [30],
            # No guest info
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reservation_invalid_numbers(self):
        """
        Test 5: Cannot reserve numbers out of range.
        """
        self.client.force_authenticate(user=self.customer)
        data = {
            "raffle_id": self.raffle.id,  # type: ignore
            "numbers": [999],  # Out of range (1-100)
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reservation_invalid_phone(self):
        """
        Test 6: Invalid phone number format is rejected.
        """
        data = {
            "raffle_id": self.raffle.id,  # type: ignore
            "numbers": [40],
            "guest_name": "Guest",
            "guest_phone": "invalid-phone-abc",  # Invalid format
            "guest_email": "guest@example.com",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("guest_phone", str(response.data))

    def test_reservation_short_phone(self):
        """
        Test 7: Phone number too short (9 digits) is rejected.
        """
        data = {
            "raffle_id": self.raffle.id,  # type: ignore
            "numbers": [41],
            "guest_name": "Guest",
            "guest_phone": "644499498",  # 9 digits
            "guest_email": "guest@example.com",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("guest_phone", str(response.data))
