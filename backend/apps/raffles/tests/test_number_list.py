from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.urls import reverse

import pytest
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient

from apps.purchases.models import Purchase, PurchaseDetail
from apps.raffles.models import Raffle


@pytest.mark.django_db
class TestRaffleAvailability:
    def test_not_found_returns_404(self, api_client: APIClient) -> None:
        url = reverse("raffle-availability", kwargs={"pk": 99999})
        resp: Response = api_client.get(url)
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_all_numbers_available(
        self, user_factory: Any, api_client: APIClient
    ) -> None:
        organizer = user_factory()
        raffle = Raffle.objects.create(
            name="A",
            number_start=1,
            number_end=5,
            price_per_number=Decimal("1.00"),
            sale_start_at="2025-01-01T00:00:00Z",
            sale_end_at="2025-12-31T00:00:00Z",
            draw_scheduled_at="2026-01-01T00:00:00Z",
            organizer=organizer,
            created_by=organizer,
            updated_by=organizer,
        )
        url = reverse("raffle-availability", kwargs={"pk": raffle.pk})
        resp: Response = api_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["raffle_id"] == raffle.pk
        assert data["raffle_id"] == raffle.pk
        assert data["taken_numbers"] == []

    def test_numbers_reflect_purchases(
        self, user_factory: Any, api_client: APIClient
    ) -> None:
        organizer = user_factory()
        customer = user_factory(email="buyer@example.com")
        raffle = Raffle.objects.create(
            name="B",
            number_start=1,
            number_end=5,
            price_per_number=Decimal("2.00"),
            sale_start_at="2025-01-01T00:00:00Z",
            sale_end_at="2025-12-31T00:00:00Z",
            draw_scheduled_at="2026-01-01T00:00:00Z",
            organizer=organizer,
            created_by=organizer,
            updated_by=organizer,
        )
        p1 = Purchase.objects.create(
            raffle=raffle,
            customer=customer,
            status=Purchase.Status.PENDING,
            total_amount=Decimal("4.00"),
        )
        PurchaseDetail.objects.create(purchase=p1, number=2, unit_price=Decimal("2.00"))
        PurchaseDetail.objects.create(purchase=p1, number=4, unit_price=Decimal("2.00"))
        p2 = Purchase.objects.create(
            raffle=raffle,
            customer=customer,
            status=Purchase.Status.PAID,
            total_amount=Decimal("2.00"),
        )
        PurchaseDetail.objects.create(purchase=p2, number=3, unit_price=Decimal("2.00"))
        p3 = Purchase.objects.create(
            raffle=raffle,
            customer=customer,
            status=Purchase.Status.CANCELED,
            total_amount=Decimal("2.00"),
        )
        PurchaseDetail.objects.create(purchase=p3, number=5, unit_price=Decimal("2.00"))

        url = reverse("raffle-availability", kwargs={"pk": raffle.pk})
        resp: Response = api_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["taken_numbers"] == [2, 3, 4]

    def test_includes_purchase_metadata(
        self, user_factory: Any, api_client: APIClient
    ) -> None:
        """Paid/reserved entries include `purchase_id` and `customer_name`."""
        organizer = user_factory()
        customer = user_factory(email="meta@example.com", name="Meta Buyer")
        raffle = Raffle.objects.create(
            name="C",
            number_start=1,
            number_end=3,
            price_per_number=Decimal("1.00"),
            sale_start_at="2025-01-01T00:00:00Z",
            sale_end_at="2025-12-31T00:00:00Z",
            draw_scheduled_at="2026-01-01T00:00:00Z",
            organizer=organizer,
            created_by=organizer,
            updated_by=organizer,
        )
        p1 = Purchase.objects.create(
            raffle=raffle,
            customer=customer,
            status=Purchase.Status.PENDING,
            total_amount=Decimal("2.00"),
        )
        PurchaseDetail.objects.create(purchase=p1, number=1, unit_price=Decimal("1.00"))

        p2 = Purchase.objects.create(
            raffle=raffle,
            customer=customer,
            status=Purchase.Status.PAID,
            total_amount=Decimal("1.00"),
        )
        PurchaseDetail.objects.create(purchase=p2, number=2, unit_price=Decimal("1.00"))

        url = reverse("raffle-availability", kwargs={"pk": raffle.pk})
        resp: Response = api_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert 1 in data["taken_numbers"]
        assert 2 in data["taken_numbers"]

    def test_paid_overrides_reserved(
        self, user_factory: Any, api_client: APIClient
    ) -> None:
        """If a number is reserved then later paid, the availability shows paid."""
        organizer = user_factory()
        customer = user_factory(email="buyer2@example.com", name="Buyer Two")
        raffle = Raffle.objects.create(
            name="D",
            number_start=1,
            number_end=3,
            price_per_number=Decimal("1.00"),
            sale_start_at="2025-01-01T00:00:00Z",
            sale_end_at="2025-12-31T00:00:00Z",
            draw_scheduled_at="2026-01-01T00:00:00Z",
            organizer=organizer,
            created_by=organizer,
            updated_by=organizer,
        )
        p1 = Purchase.objects.create(
            raffle=raffle,
            customer=customer,
            status=Purchase.Status.PENDING,
            total_amount=Decimal("1.00"),
        )
        PurchaseDetail.objects.create(purchase=p1, number=2, unit_price=Decimal("1.00"))
        p2 = Purchase.objects.create(
            raffle=raffle,
            customer=customer,
            status=Purchase.Status.PAID,
            total_amount=Decimal("1.00"),
        )
        PurchaseDetail.objects.create(purchase=p2, number=2, unit_price=Decimal("1.00"))

        url = reverse("raffle-availability", kwargs={"pk": raffle.pk})
        resp: Response = api_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert 2 in data["taken_numbers"]

    def test_customer_name_falls_back_to_email(
        self, user_factory: Any, api_client: APIClient
    ) -> None:
        """If customer.name is missing, availability returns email as customer_name."""
        organizer = user_factory()
        customer = user_factory(email="no_name@example.com")
        customer.name = ""
        customer.save()
        raffle = Raffle.objects.create(
            name="E",
            number_start=1,
            number_end=2,
            price_per_number=Decimal("1.00"),
            sale_start_at="2025-01-01T00:00:00Z",
            sale_end_at="2025-12-31T00:00:00Z",
            draw_scheduled_at="2026-01-01T00:00:00Z",
            organizer=organizer,
            created_by=organizer,
            updated_by=organizer,
        )
        p = Purchase.objects.create(
            raffle=raffle,
            customer=customer,
            status=Purchase.Status.PAID,
            total_amount=Decimal("1.00"),
        )
        PurchaseDetail.objects.create(purchase=p, number=1, unit_price=Decimal("1.00"))

        url = reverse("raffle-availability", kwargs={"pk": raffle.pk})
        resp: Response = api_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert 1 in data["taken_numbers"]

    def test_numbers_are_ordered_and_available_have_null_purchase(
        self, user_factory: Any, api_client: APIClient
    ) -> None:
        organizer = user_factory()
        raffle = Raffle.objects.create(
            name="F",
            number_start=10,
            number_end=15,
            price_per_number=Decimal("1.00"),
            sale_start_at="2025-01-01T00:00:00Z",
            sale_end_at="2025-12-31T00:00:00Z",
            draw_scheduled_at="2026-01-01T00:00:00Z",
            organizer=organizer,
            created_by=organizer,
            updated_by=organizer,
        )
        url = reverse("raffle-availability", kwargs={"pk": raffle.pk})
        resp: Response = api_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["taken_numbers"] == []
