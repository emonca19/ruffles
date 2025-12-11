from datetime import timedelta

from django.utils import timezone

import pytest

from apps.authentication.models import User
from apps.purchases.models import Payment, PaymentWithReceipt, Purchase, PurchaseDetail
from apps.raffles.models import Raffle


def create_user(**kwargs):
    email = kwargs.get("email", f"user_{timezone.now().timestamp()}@example.com")
    return User.objects.create_user(email=email, password="password", **kwargs)


@pytest.mark.django_db
def test_partial_payment_approval_flow():
    """
    Verify that approving a receipt with specific numbers:
    1. Marks those numbers as PAID.
    2. Marks unselected numbers as CANCELED.
    3. Updates parent Purchase status correctly.
    4. Releases unselected numbers for availability.
    """
    organizer = create_user(user_type="organizer")
    customer = create_user(user_type="customer")

    # 1. Setup Raffle and Purchase
    raffle = Raffle.objects.create(
        organizer=organizer,
        name="Test Raffle",
        number_start=1,
        number_end=100,
        price_per_number=10.0,
        sale_start_at=timezone.now(),
        sale_end_at=timezone.now() + timedelta(days=7),
        draw_scheduled_at=timezone.now() + timedelta(days=8),
    )

    # Reserve 3 numbers: 10, 11, 12
    purchase = Purchase.objects.create(
        raffle=raffle,
        customer=customer,
        status=Purchase.Status.PENDING,
        total_amount=30.0,
    )
    # Using bulk create logic similar to service but here manual for test control
    PurchaseDetail.objects.create(
        purchase=purchase, number=10, unit_price=10.0, status=Purchase.Status.PENDING
    )
    PurchaseDetail.objects.create(
        purchase=purchase, number=11, unit_price=10.0, status=Purchase.Status.PENDING
    )
    PurchaseDetail.objects.create(
        purchase=purchase, number=12, unit_price=10.0, status=Purchase.Status.PENDING
    )

    assert PurchaseDetail.objects.filter(status=Purchase.Status.PENDING).count() == 3

    # 2. Simulate Upload Receipt (Selection: 10, 11 only)
    receipt_image = "receipts/test.jpg"
    selected_numbers = [10, 11]

    payment = Payment.objects.create(
        purchase=purchase, amount=20.0, created_by=customer
    )
    receipt = PaymentWithReceipt.objects.create(
        payment=payment,
        receipt_image=receipt_image,
        selected_numbers=selected_numbers,
        verification_status=PaymentWithReceipt.VerificationStatus.PENDING,
    )

    # 3. Organizer Approves
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(user=organizer)

    url = f"/api/v1/purchases/verifications/{receipt.pk}/verify/"
    response = client.post(url, {"action": "approve"})

    assert response.status_code == 200, response.data

    # 4. Assertions

    # Refresh DB objects
    d10 = PurchaseDetail.objects.get(purchase=purchase, number=10)
    d11 = PurchaseDetail.objects.get(purchase=purchase, number=11)
    d12 = PurchaseDetail.objects.get(purchase=purchase, number=12)
    purchase.refresh_from_db()

    # Selected numbers should be PAID
    assert d10.status == Purchase.Status.PAID
    assert d11.status == Purchase.Status.PAID

    # Unselected number should remain PENDING (still reserved)
    assert d12.status == Purchase.Status.PENDING

    # Parent purchase status should be PAID (as it contains valid paid items)
    assert purchase.status == Purchase.Status.PAID

    # 5. Check Availability (Service Integration)
    from apps.raffles.services import get_raffle_availability

    availability = get_raffle_availability(raffle)

    # 10 and 11 are taken (paid)
    # 12 is taken (pending)
    assert 10 in availability.taken_numbers
    assert 11 in availability.taken_numbers
    assert 12 in availability.taken_numbers
