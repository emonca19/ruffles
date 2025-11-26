from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.purchases.models import Purchase, PurchaseDetail
from apps.raffles.models import Raffle

if TYPE_CHECKING:
    from django.contrib.auth.models import AnonymousUser

    from apps.authentication.models import User


def create_reservation(
    user: "User | AnonymousUser",
    raffle_id: int,
    numbers: list[int],
    guest_info: dict[str, str] | None = None,
) -> Purchase:
    """
    Creates a reservation (Purchase) for the given numbers.
    """
    if guest_info is None:
        guest_info = {}

    with transaction.atomic():
        # 1. Get Raffle (lock it to prevent race conditions)
        try:
            raffle = Raffle.objects.select_for_update().get(pk=raffle_id)
        except Raffle.DoesNotExist:
            raise ValidationError("Raffle not found.") from None

        if not raffle.is_on_sale:
            raise ValidationError("Raffle is not currently on sale.")

        # 2. Validate Numbers Range
        for num in numbers:
            if not (raffle.number_start <= num <= raffle.number_end):
                raise ValidationError(f"Number {num} is out of range.")

        # 3. Check Availability (Locking)
        # We need to ensure these numbers aren't taken by ACTIVE purchases
        # Active = Pending (not expired) OR Paid
        taken_numbers = PurchaseDetail.objects.filter(
            purchase__raffle=raffle, number__in=numbers
        ).select_related("purchase")

        for detail in taken_numbers:
            # Check if purchase is active
            if detail.purchase.status in [
                Purchase.Status.PAID,
                Purchase.Status.PENDING,
            ]:
                # You might want to check expiration here too, but for simplicity:
                raise ValidationError(f"Number {detail.number} is not available.")

        # 4. Create Purchase
        total_amount = raffle.price_per_number * len(numbers)

        purchase = Purchase(
            raffle=raffle, total_amount=total_amount, status=Purchase.Status.PENDING
        )

        if user.is_authenticated:
            purchase.customer = user
        else:
            purchase.guest_name = guest_info.get("guest_name", "")
            purchase.guest_phone = guest_info.get("guest_phone", "")
            purchase.guest_email = guest_info.get("guest_email", "")

        purchase.full_clean()  # Validate model constraints
        purchase.save()

        # 5. Create Details
        details = [
            PurchaseDetail(
                purchase=purchase, number=num, unit_price=raffle.price_per_number
            )
            for num in numbers
        ]
        PurchaseDetail.objects.bulk_create(details)

        return purchase
