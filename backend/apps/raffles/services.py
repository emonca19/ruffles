"""Raffle domain services."""

from __future__ import annotations

from dataclasses import dataclass

from apps.purchases.models import Purchase, PurchaseDetail

from .models import Raffle


@dataclass(frozen=True)
class RaffleAvailability:
    raffle_id: int
    taken_numbers: list[int]


def get_raffle_availability(raffle: Raffle) -> RaffleAvailability:
    # Get all numbers that are either PAID or RESERVED (not CANCELED)
    # We don't need customer info anymore for the public endpoint
    taken_numbers = (
        PurchaseDetail.objects.filter(purchase__raffle=raffle)
        .exclude(status=Purchase.Status.CANCELED)
        .exclude(status=Purchase.Status.EXPIRED)
        .exclude(purchase__status=Purchase.Status.CANCELED)
        .exclude(purchase__status=Purchase.Status.EXPIRED)
        .values_list("number", flat=True)
        .order_by("number")
        .distinct()
    )

    return RaffleAvailability(
        raffle_id=raffle.id,
        taken_numbers=list(taken_numbers),
    )
