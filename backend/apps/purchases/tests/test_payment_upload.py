from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.purchases.models import Payment, PaymentWithReceipt, Purchase
from apps.raffles.models import Raffle


@pytest.mark.django_db
class TestPaymentUpload:
    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email="user@example.com",
            password="password",
            user_type=User.UserType.CUSTOMER,
        )

    @pytest.fixture
    def raffle(self, user):
        organizer = User.objects.create_user(
            email="org@example.com",
            password="password",
            user_type=User.UserType.ORGANIZER,
        )
        return Raffle.objects.create(
            name="Test Raffle",
            number_start=1,
            number_end=100,
            price_per_number=10.00,
            sale_start_at="2024-01-01T00:00:00Z",
            sale_end_at="2025-01-01T00:00:00Z",
            draw_scheduled_at="2025-01-02T00:00:00Z",
            organizer=organizer,
        )

    @pytest.fixture
    def user_purchase(self, user, raffle):
        return Purchase.objects.create(
            raffle=raffle,
            customer=user,
            total_amount=20.00,
            status=Purchase.Status.PENDING,
        )

    @pytest.fixture
    def guest_purchase(self, raffle):
        return Purchase.objects.create(
            raffle=raffle,
            guest_name="Guest",
            guest_phone="1234567890",
            total_amount=20.00,
            status=Purchase.Status.PENDING,
        )

    @pytest.fixture
    def image_file(self):
        return SimpleUploadedFile(
            name="test_receipt.jpg",
            content=b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x05\x04\x04\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b",
            content_type="image/jpeg",
        )

    def test_upload_receipt_authenticated(
        self, api_client, user, user_purchase, image_file
    ):
        """Authenticated user can upload receipt for their purchase."""
        api_client.force_authenticate(user=user)
        url = reverse("purchase-upload-receipt", args=[user_purchase.id])

        response = api_client.post(
            url, {"receipt_image": image_file}, format="multipart"
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert Payment.objects.filter(purchase=user_purchase).exists()
        assert PaymentWithReceipt.objects.filter(
            payment__purchase=user_purchase
        ).exists()

    def test_upload_receipt_guest(self, api_client, guest_purchase, image_file):
        """Guest can upload receipt using matching phone number."""
        url = reverse("purchase-upload-receipt", args=[guest_purchase.id])

        response = api_client.post(
            url,
            {"receipt_image": image_file, "phone": "1234567890"},
            format="multipart",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert Payment.objects.filter(purchase=guest_purchase).exists()

    def test_upload_receipt_guest_wrong_phone(
        self, api_client, guest_purchase, image_file
    ):
        """Guest cannot upload with wrong phone number."""
        url = reverse("purchase-upload-receipt", args=[guest_purchase.id])

        response = api_client.post(
            url,
            {"receipt_image": image_file, "phone": "0000000000"},
            format="multipart",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_upload_receipt_no_file(self, api_client, user, user_purchase):
        """Request without file returns 400."""
        api_client.force_authenticate(user=user)
        url = reverse("purchase-upload-receipt", args=[user_purchase.id])

        response = api_client.post(url, {}, format="multipart")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upload_receipt_invalid_file(self, api_client, user, user_purchase):
        """Uploading non-image file returns 400."""
        api_client.force_authenticate(user=user)
        url = reverse("purchase-upload-receipt", args=[user_purchase.id])

        text_file = SimpleUploadedFile(
            "test.txt", b"content", content_type="text/plain"
        )
        response = api_client.post(
            url, {"receipt_image": text_file}, format="multipart"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
