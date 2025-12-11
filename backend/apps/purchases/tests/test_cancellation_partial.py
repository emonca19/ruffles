from datetime import timedelta

from django.utils import timezone

import pytest
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.purchases.models import Purchase, PurchaseDetail
from apps.raffles.models import Raffle


def create_user(**kwargs):
    email = kwargs.get("email", f"user_{timezone.now().timestamp()}@example.com")
    return User.objects.create_user(email=email, password="password", **kwargs)


@pytest.mark.django_db
def test_cancel_partial_paid_purchase():
    """
    Scenario:
    1. User reserves tickets 1, 2, 3.
    2. User pays for Ticket 1.
    3. Purchase status becomes PAID (aggregate).
    4. User tries to cancel remaining tickets (2, 3).

    Expected:
    - Status 200 OK (or success).
    - Ticket 1 remains PAID.
    - Ticket 2, 3 become CANCELED.

    Current Bug:
    - Returns 400 "No se puede cancelar una compra pagada."
    - Or cancels ALL tickets including PAID one.
    """
    organizer = create_user(user_type="organizer")
    customer = create_user(user_type="customer")

    raffle = Raffle.objects.create(
        organizer=organizer,
        name="Partial Cancel Raffle",
        number_start=1,
        number_end=100,
        price_per_number=10.0,
        sale_start_at=timezone.now(),
        sale_end_at=timezone.now() + timedelta(days=7),
        draw_scheduled_at=timezone.now() + timedelta(days=8),
    )

    # 1. Setup Data
    purchase = Purchase.objects.create(
        raffle=raffle,
        customer=customer,
        status=Purchase.Status.PENDING,
        total_amount=30.0,
    )
    d1 = PurchaseDetail.objects.create(
        purchase=purchase, number=1, unit_price=10.0, status=Purchase.Status.PAID
    )
    d2 = PurchaseDetail.objects.create(
        purchase=purchase, number=2, unit_price=10.0, status=Purchase.Status.PENDING
    )
    d3 = PurchaseDetail.objects.create(
        purchase=purchase, number=3, unit_price=10.0, status=Purchase.Status.PENDING
    )

    # Force aggregate update to reflect PAID state
    purchase.update_status_from_details()
    assert purchase.status == Purchase.Status.PAID

    # 2. Attempt Cancellation
    client = APIClient()
    client.force_authenticate(user=customer)

    url = f"/api/v1/purchases/{purchase.id}/cancel/"
    response = client.post(url)

    print(f"\nResponse: {response.status_code} {response.data}")

    assert (
        response.status_code == 200
    ), "Should allow cancelling pending tickets even if purchase is marked PAID"

    # 3. Verify Detail Statuses
    d1.refresh_from_db()
    d2.refresh_from_db()
    d3.refresh_from_db()

    assert d1.status == Purchase.Status.PAID, "Paid ticket should NOT be canceled"
    assert d2.status == Purchase.Status.CANCELED, "Pending ticket should be canceled"
    assert d3.status == Purchase.Status.CANCELED, "Pending ticket should be canceled"
