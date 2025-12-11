from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

import pytest

from apps.purchases.models import Purchase, PurchaseDetail
from apps.raffles.models import Raffle
from apps.raffles.services import get_raffle_availability

User = get_user_model()


def create_user(**kwargs):
    email = kwargs.get("email", f"user_{timezone.now().timestamp()}@example.com")
    return User.objects.create_user(email=email, password="password", **kwargs)


@pytest.mark.django_db
def test_availability_includes_paid_tickets():
    """
    Validation Test: Ensure that tickets with status PAID are correctly reported as 'taken'.
    User reported an issue where only PENDING tickets were showing up.
    """
    organizer = create_user(user_type="organizer")
    customer = create_user(user_type="customer")

    raffle = Raffle.objects.create(
        organizer=organizer,
        name="Paid Test Raffle",
        number_start=1,
        number_end=100,
        price_per_number=10.0,
        sale_start_at=timezone.now(),
        sale_end_at=timezone.now() + timedelta(days=7),
        draw_scheduled_at=timezone.now() + timedelta(days=8),
    )

    # 1. Create a PAID purchase
    # Logic: Purchase is PAID, and Details are PAID
    purchase = Purchase.objects.create(
        raffle=raffle, customer=customer, status=Purchase.Status.PAID, total_amount=20.0
    )

    # Create 2 Paid tickets (No. 5, 6)
    PurchaseDetail.objects.create(
        purchase=purchase, number=5, unit_price=10.0, status=Purchase.Status.PAID
    )
    PurchaseDetail.objects.create(
        purchase=purchase, number=6, unit_price=10.0, status=Purchase.Status.PAID
    )

    # 2. Create a PENDING purchase (No. 7)
    pending_purchase = Purchase.objects.create(
        raffle=raffle,
        customer=customer,
        status=Purchase.Status.PENDING,
        total_amount=10.0,
    )
    PurchaseDetail.objects.create(
        purchase=pending_purchase,
        number=7,
        unit_price=10.0,
        status=Purchase.Status.PENDING,
    )

    # 3. Call Availability Service
    availability = get_raffle_availability(raffle)

    print(f"Taken numbers: {availability.taken_numbers}")

    # 4. Assertions
    assert 5 in availability.taken_numbers, "Paid ticket #5 should be taken"
    assert 6 in availability.taken_numbers, "Paid ticket #6 should be taken"
    assert 7 in availability.taken_numbers, "Pending ticket #7 should be taken"
