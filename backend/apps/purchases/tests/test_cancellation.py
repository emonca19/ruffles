from datetime import timedelta

from django.utils import timezone

import pytest
from rest_framework import status
from rest_framework.reverse import reverse

from apps.purchases.models import Purchase
from apps.raffles.models import Raffle


class TestCancellation:
    pytestmark = pytest.mark.django_db

    @pytest.fixture
    def raffle(self, organizer_user):
        return Raffle.objects.create(
            name="Cancelable Raffle",
            organizer=organizer_user,
            number_start=1,
            number_end=100,
            price_per_number=10.00,
            sale_start_at=timezone.now(),
            sale_end_at=timezone.now() + timedelta(days=1),
            draw_scheduled_at=timezone.now() + timedelta(days=2),
        )

    @pytest.fixture
    def pending_purchase(self, raffle, user_factory):
        customer = user_factory(email="buyer@example.com")
        p = Purchase.objects.create(
            raffle=raffle,
            customer=customer,
            status=Purchase.Status.PENDING,
            total_amount=10.00,
        )
        from apps.purchases.models import PurchaseDetail

        PurchaseDetail.objects.create(purchase=p, number=1, unit_price=10.00)
        return p

    @pytest.fixture
    def guest_purchase(self, raffle):
        p = Purchase.objects.create(
            raffle=raffle,
            guest_name="Guest User",
            guest_phone="1234567890",
            status=Purchase.Status.PENDING,
            total_amount=10.00,
        )
        from apps.purchases.models import PurchaseDetail

        PurchaseDetail.objects.create(purchase=p, number=2, unit_price=10.00)
        return p
        from apps.purchases.models import PurchaseDetail

        PurchaseDetail.objects.create(purchase=p, number=2, unit_price=10.00)
        return p

    def test_customer_cancel_own_reservation(self, api_client, pending_purchase):
        """Story 10: Authenticated customer can cancel their own pending reservation."""
        api_client.force_authenticate(user=pending_purchase.customer)
        url = reverse("purchase-cancel", args=[pending_purchase.id])

        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        pending_purchase.refresh_from_db()
        assert pending_purchase.status == Purchase.Status.CANCELED

    def test_customer_cannot_cancel_others(
        self, api_client, pending_purchase, user_factory
    ):
        """Security: Customer A cannot cancel Customer B's reservation."""
        other_user = user_factory(email="thief@example.com")
        api_client.force_authenticate(user=other_user)
        url = reverse("purchase-cancel", args=[pending_purchase.id])

        response = api_client.post(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        pending_purchase.refresh_from_db()
        assert pending_purchase.status == Purchase.Status.PENDING

    def test_organizer_can_cancel_any_reservation(
        self, api_client, organizer_user, pending_purchase
    ):
        """Story 16: Organizer can cancel any reservation."""
        api_client.force_authenticate(user=organizer_user)
        url = reverse("purchase-cancel", args=[pending_purchase.id])

        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        pending_purchase.refresh_from_db()
        assert pending_purchase.status == Purchase.Status.CANCELED

    def test_guest_cancel_own_reservation_valid_phone(self, api_client, guest_purchase):
        """Story 10 (Guest): Guest can cancel with matching phone number."""
        url = reverse("purchase-cancel", args=[guest_purchase.id])
        data = {"phone": "1234567890"}

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        guest_purchase.refresh_from_db()
        assert guest_purchase.status == Purchase.Status.CANCELED

    def test_guest_cancel_invalid_phone(self, api_client, guest_purchase):
        """Security: Guest cannot cancel without correct phone number."""
        url = reverse("purchase-cancel", args=[guest_purchase.id])
        # Wrong phone
        response = api_client.post(url, {"phone": "0000000000"})
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # No phone
        response = api_client.post(url, {})
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cannot_cancel_paid_purchase(
        self, api_client, organizer_user, pending_purchase
    ):
        """Validation: Cannot cancel a purchase that is already PAID."""
        pending_purchase.status = Purchase.Status.PAID
        pending_purchase.save()
        pending_purchase.details.update(status=Purchase.Status.PAID)

        api_client.force_authenticate(user=organizer_user)
        url = reverse("purchase-cancel", args=[pending_purchase.id])

        response = api_client.post(url)

        # Should be Bad Request or Conflict, logic dictates we can't just release it
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "no se puede cancelar" in str(response.data).lower()

    def test_idempotency_cancel_already_canceled(self, api_client, pending_purchase):
        """Validation: Canceling an already canceled purchase is successful (idempotent)."""
        pending_purchase.status = Purchase.Status.CANCELED
        pending_purchase.save()

        api_client.force_authenticate(user=pending_purchase.customer)
        url = reverse("purchase-cancel", args=[pending_purchase.id])

        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert pending_purchase.status == Purchase.Status.CANCELED

    def test_cancel_rejects_pending_receipt(self, api_client, pending_purchase):
        """Logic: canceling a purchase should auto-reject any pending receipt."""
        from apps.purchases.models import Payment, PaymentWithReceipt

        # Create a pending payment/receipt
        payment = Payment.objects.create(
            purchase=pending_purchase, amount=pending_purchase.total_amount
        )
        receipt = PaymentWithReceipt.objects.create(
            payment=payment,
            verification_status=PaymentWithReceipt.VerificationStatus.PENDING,
            receipt_image="test.jpg",
        )

        api_client.force_authenticate(user=pending_purchase.customer)
        url = reverse("purchase-cancel", args=[pending_purchase.id])

        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        receipt.refresh_from_db()
        assert (
            receipt.verification_status
            == PaymentWithReceipt.VerificationStatus.REJECTED
        )
