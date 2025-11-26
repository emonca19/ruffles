import os
from decimal import Decimal

import django
from django.utils import timezone

from apps.authentication.models import User
from apps.purchases.models import Purchase
from apps.raffles.models import Raffle

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# Ensure we have a raffle and user (organizer)
organizer, _ = User.objects.get_or_create(
    email="admin@example.com", defaults={"name": "Admin"}
)
raffle, _ = Raffle.objects.get_or_create(
    name="Test Raffle",
    defaults={
        "number_start": 0,
        "number_end": 100,
        "price_per_number": Decimal("10.00"),
        "sale_start_at": timezone.now(),
        "sale_end_at": timezone.now() + timezone.timedelta(days=7),
        "draw_scheduled_at": timezone.now() + timezone.timedelta(days=8),
        "organizer": organizer,
    },
)

# Test Guest Purchase
try:
    guest_purchase = Purchase.objects.create(
        raffle=raffle,
        customer=None,
        guest_name="Guest User",
        guest_phone="1234567890",
        total_amount=Decimal("20.00"),
    )
    print(f"SUCCESS: Created guest purchase: {guest_purchase}")
    print(f"Guest Phone: {guest_purchase.guest_phone}")
except Exception as e:
    print(f"FAILURE: Could not create guest purchase. Error: {e}")

# Test Validation (Should fail if neither customer nor guest_phone)
try:
    Purchase.objects.create(
        raffle=raffle, customer=None, guest_phone=None, total_amount=Decimal("10.00")
    )
    print("FAILURE: Validation failed to catch missing customer/phone")
except Exception as e:
    print(f"SUCCESS: Caught expected validation error: {e}")
