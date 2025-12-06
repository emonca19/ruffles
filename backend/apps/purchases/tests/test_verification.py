from datetime import timedelta

from django.urls import reverse
from django.utils import timezone

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.purchases.models import Payment, PaymentWithReceipt, Purchase
from apps.raffles.models import Raffle


@pytest.mark.django_db
class TestVerification:
    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def organizer(self):
        user, _ = User.objects.get_or_create(
            email="organizer@example.com",
            defaults={
                "password": "password",
                "user_type": User.UserType.ORGANIZER,
            },
        )
        return user

    @pytest.fixture
    def customer(self):
        user, _ = User.objects.get_or_create(
            email="customer@example.com",
            defaults={
                "password": "password",
                "user_type": User.UserType.CUSTOMER,
            },
        )
        return user

    @pytest.fixture
    def raffle(self, organizer):
        return Raffle.objects.create(
            name="Test Raffle",
            number_start=1,
            number_end=100,
            price_per_number=10.00,
            sale_start_at=timezone.now() + timedelta(days=1),
            sale_end_at=timezone.now() + timedelta(days=10),
            draw_scheduled_at=timezone.now() + timedelta(days=11),
            organizer=organizer,
        )

    @pytest.fixture
    def purchase(self, raffle, customer):
        return Purchase.objects.create(
            raffle=raffle,
            customer=customer,
            total_amount=20.00,
            status=Purchase.Status.PENDING,
        )

    @pytest.fixture
    def payment_with_receipt(self, purchase):
        payment = Payment.objects.create(
            purchase=purchase,
            amount=purchase.total_amount,
        )
        return PaymentWithReceipt.objects.create(
            payment=payment,
            receipt_image="receipts/test.jpg",
            verification_status=PaymentWithReceipt.VerificationStatus.PENDING,
        )

    def test_list_verifications_organizer(
        self, api_client, organizer, payment_with_receipt
    ):
        """Organizer can list pending verifications."""
        api_client.force_authenticate(user=organizer)
        url = reverse("verifications-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["payment_id"] == payment_with_receipt.payment.id

    def test_list_verifications_customer_denied(self, api_client, customer):
        """Customer cannot list verifications."""
        api_client.force_authenticate(user=customer)
        url = reverse("verifications-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_verify_approve(self, api_client, organizer, payment_with_receipt):
        """Organizer can approve a verification."""
        api_client.force_authenticate(user=organizer)
        url = reverse("verifications-verify", args=[payment_with_receipt.payment.id])

        response = api_client.post(url, {"action": "approve"})

        assert response.status_code == status.HTTP_200_OK

        payment_with_receipt.refresh_from_db()
        assert (
            payment_with_receipt.verification_status
            == PaymentWithReceipt.VerificationStatus.APPROVED
        )
        assert payment_with_receipt.verified_by == organizer

        purchase = payment_with_receipt.payment.purchase
        purchase.refresh_from_db()
        assert purchase.status == Purchase.Status.PAID

    def test_verify_reject(self, api_client, organizer, payment_with_receipt):
        """Organizer can reject a verification."""
        api_client.force_authenticate(user=organizer)
        url = reverse("verifications-verify", args=[payment_with_receipt.payment.id])

        response = api_client.post(url, {"action": "reject"})

        assert response.status_code == status.HTTP_200_OK

        payment_with_receipt.refresh_from_db()
        assert (
            payment_with_receipt.verification_status
            == PaymentWithReceipt.VerificationStatus.REJECTED
        )
        assert payment_with_receipt.verified_by == organizer

        # Purchase status should NOT change to paid
        purchase = payment_with_receipt.payment.purchase
        purchase.refresh_from_db()
        assert purchase.status == Purchase.Status.PENDING

    def test_verify_invalid_action(self, api_client, organizer, payment_with_receipt):
        """Invalid action returns 400."""
        api_client.force_authenticate(user=organizer)
        url = reverse("verifications-verify", args=[payment_with_receipt.payment.id])

        response = api_client.post(url, {"action": "invalid"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_permission_denied(self, api_client, customer, payment_with_receipt):
        """Customer cannot verify receipts."""
        api_client.force_authenticate(user=customer)
        url = reverse("verifications-verify", args=[payment_with_receipt.payment.id])

        response = api_client.post(url, {"action": "approve"})
        assert response.status_code == status.HTTP_403_FORBIDDEN
