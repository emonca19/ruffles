"""Raffle domain services."""

from __future__ import annotations

from collections import Counter
from collections.abc import Sequence
from dataclasses import dataclass

from django.db.models import Prefetch

from apps.purchases.models import Purchase, PurchaseDetail

from .models import Raffle


@dataclass(frozen=True)
class RaffleNumberStatus:
    number: int
    status: str
    purchase_id: int | None = None
    customer_name: str | None = None


@dataclass(frozen=True)
class RaffleAvailability:
    raffle_id: int
    range_start: int
    range_end: int
    total_numbers: int
    summary: dict[str, int]
    numbers: Sequence[RaffleNumberStatus]


def get_raffle_availability(raffle: Raffle) -> RaffleAvailability:
    number_entries: list[RaffleNumberStatus] = []
    taken_numbers: dict[int, RaffleNumberStatus] = {}

    related_purchases = (
        Purchase.objects.filter(raffle=raffle)
        .exclude(status=Purchase.Status.CANCELED)
        .select_related("customer")
        .order_by("created_at")
        .prefetch_related(Prefetch("details", queryset=PurchaseDetail.objects.all()))
    )

    for purchase in related_purchases:
        customer = purchase.customer
        customer_name = getattr(customer, "name", None) or customer.email
        current_status = (
            "paid" if purchase.status == Purchase.Status.PAID else "reserved"
        )
        for detail in purchase.details.all():
            taken_numbers[detail.number] = RaffleNumberStatus(
                number=detail.number,
                status=current_status,
                purchase_id=purchase.pk,
                customer_name=customer_name,
            )

    for number in range(raffle.number_start, raffle.number_end + 1):
        number_entries.append(
            taken_numbers.get(
                number,
                RaffleNumberStatus(number=number, status="available"),
            )
        )

    summary_counter = Counter(entry.status for entry in number_entries)
    for key in ("available", "reserved", "paid"):
        summary_counter.setdefault(key, 0)

    return RaffleAvailability(
        raffle_id=raffle.id,
        range_start=raffle.number_start,
        range_end=raffle.number_end,
        total_numbers=raffle.number_end - raffle.number_start + 1,
        summary=dict(summary_counter),
        numbers=number_entries,
    )
