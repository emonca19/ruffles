from django.urls import reverse

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.purchases.models import Purchase
from apps.raffles.models import Raffle


@pytest.mark.django_db
class TestDuplicateReceiptUpload:
    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def active_raffle(self, db):
        organizer = User.objects.create_user(
            email="org_dup@example.com",
            password="password",
            user_type=User.UserType.ORGANIZER,
        )
        return Raffle.objects.create(
            name="Test Raffle Duplicate",
            number_start=1,
            number_end=100,
            price_per_number=10.00,
            sale_start_at="2024-01-01T00:00:00Z",
            sale_end_at="2026-01-01T00:00:00Z",
            draw_scheduled_at="2026-01-02T00:00:00Z",
            organizer=organizer,
        )

    def test_cannot_upload_receipt_twice_for_same_number(
        self, api_client: APIClient, active_raffle: Raffle
    ):
        """
        Verify that a user cannot upload a receipt for a number that is already
        pending verification in another receipt.
        """
        # 1. Create a reservation with 2 numbers
        url_create = reverse("purchase-list")
        payload = {
            "raffle_id": active_raffle.id,
            "numbers": [10, 20],
            "guest_name": "Test Guest",
            "guest_phone": "1234567890",
            "guest_email": "test@example.com",
        }
        resp_create = api_client.post(url_create, payload)
        assert resp_create.status_code == status.HTTP_201_CREATED
        purchase_id = resp_create.data["id"]

        # Ensure PurchaseDetails are created (the view does this via service, but let's be sure)
        purchase = Purchase.objects.get(pk=purchase_id)
        assert purchase.details.count() == 2

        # 2. Upload receipt for number 10
        url_upload = reverse("purchase-upload-receipt", args=[purchase_id])

        from django.core.files.uploadedfile import SimpleUploadedFile

        # Minimal valid JPEG header
        dummy_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\xff\xc0\x00\x11\x08\x00\n\x00\n\x03\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00?\x00\xbf"

        file = SimpleUploadedFile("receipt.jpg", dummy_jpeg, content_type="image/jpeg")

        data_1 = {
            "phone": "1234567890",
            "numbers": [10],  # Paying for #10
            "receipt_image": file,
        }

        resp_upload_1 = api_client.post(url_upload, data_1, format="multipart")
        assert resp_upload_1.status_code == status.HTTP_201_CREATED

        # 3. Attempt to upload receipt for number 10 AGAIN
        file2 = SimpleUploadedFile(
            "receipt2.jpg", dummy_jpeg, content_type="image/jpeg"
        )

        data_2 = {
            "phone": "1234567890",
            "numbers": [10],  # Trying to pay for #10 again
            "receipt_image": file2,
        }

        resp_upload_2 = api_client.post(url_upload, data_2, format="multipart")

        # This SHOULD fail with 400 Bad Request
        assert resp_upload_2.status_code == status.HTTP_400_BAD_REQUEST
        # We expect a specific error message about numbers being in process
        assert "en proceso de verificación" in str(resp_upload_2.data)

    def test_can_upload_receipt_for_different_numbers(
        self, api_client: APIClient, active_raffle: Raffle
    ):
        """
        Verify that a user CAN upload a second receipt for DIFFERENT numbers
        in the same purchase.
        """
        # 1. Create a reservation with 2 numbers
        url_create = reverse("purchase-list")
        payload = {
            "raffle_id": active_raffle.id,
            "numbers": [30, 40],
            "guest_name": "Test Guest",
            "guest_phone": "1234567890",
            "guest_email": "test@example.com",
        }
        resp_create = api_client.post(url_create, payload)
        assert resp_create.status_code == status.HTTP_201_CREATED
        purchase_id = resp_create.data["id"]

        # 2. Upload receipt for number 30
        url_upload = reverse("purchase-upload-receipt", args=[purchase_id])

        from io import BytesIO

        from django.core.files.uploadedfile import SimpleUploadedFile

        from PIL import Image

        img_io = BytesIO()
        Image.new("RGB", (100, 100), color="blue").save(img_io, format="JPEG")
        img_io.seek(0)
        file = SimpleUploadedFile(
            "receipt.jpg", img_io.read(), content_type="image/jpeg"
        )

        data_1 = {
            "phone": "1234567890",
            "numbers": [30],
            "receipt_image": file,
        }

        resp_upload_1 = api_client.post(url_upload, data_1, format="multipart")
        assert resp_upload_1.status_code == status.HTTP_201_CREATED

        # 3. Upload receipt for number 40 (Different number)
        img_io.seek(0)
        file2 = SimpleUploadedFile(
            "receipt2.jpg", img_io.read(), content_type="image/jpeg"
        )

        data_2 = {
            "phone": "1234567890",
            "numbers": [40],
            "receipt_image": file2,
        }

        resp_upload_2 = api_client.post(url_upload, data_2, format="multipart")

        # This should succeed
        assert resp_upload_2.status_code == status.HTTP_201_CREATED
