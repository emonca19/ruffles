from decimal import Decimal

from django.urls import reverse
from django.utils import timezone

from rest_framework.test import APITestCase

from apps.authentication.models import User
from apps.raffles.models import Raffle


class ValidationEdgeCaseTests(APITestCase):
    def setUp(self):
        self.organizer, _ = User.objects.get_or_create(
            email="organizer@example.com",
            defaults={"password": "password123", "user_type": User.UserType.ORGANIZER},
        )
        self.raffle = Raffle.objects.create(
            name="Test Raffle",
            number_start=1,
            number_end=100,
            price_per_number=Decimal("10.00"),
            sale_start_at=timezone.now(),
            sale_end_at=timezone.now() + timezone.timedelta(days=7),
            draw_scheduled_at=timezone.now() + timezone.timedelta(days=8),
            organizer=self.organizer,
        )
        self.url = reverse("purchase-list")

    def test_duplicate_numbers_in_request(self):
        """
        Test submitting duplicate numbers in the same request.
        """
        data = {
            "raffle_id": self.raffle.id,
            "numbers": [10, 10],  # Duplicate!
            "guest_name": "Guest",
            "guest_phone": "1234567890",
        }
        response = self.client.post(self.url, data)

        # If it crashes (500), this assertion will fail (or we'll see the error)
        # If it's handled, it should be 400.
        if response.status_code == 500:
            print("\nFAILURE: Server crashed (500) on duplicate numbers.")
        elif response.status_code == 400:
            print("\nSUCCESS: Server rejected duplicates with 400.")
        else:
            print(f"\nRESULT: Status {response.status_code}")

        self.assertNotEqual(response.status_code, 500)
