from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, ClassVar

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import QuerySet
from django.utils import timezone

if TYPE_CHECKING:
    from apps.authentication.models import User
    from apps.raffles.models import Raffle


def _default_expires_at() -> datetime:
    now = timezone.now()
    return now + timedelta(hours=24)


class PurchaseQuerySet(QuerySet["Purchase"]):
    def active(self) -> PurchaseQuerySet:
        now = timezone.now()
        return self.filter(
            status=Purchase.Status.PENDING,
            expires_at__gt=now,
        )

    def paid(self) -> PurchaseQuerySet:
        return self.filter(status=Purchase.Status.PAID)


class PurchaseManager(models.Manager["Purchase"]):
    def get_queryset(self) -> PurchaseQuerySet:  # type: ignore[override]
        return PurchaseQuerySet(self.model, using=self._db)

    def active(self) -> PurchaseQuerySet:
        return self.get_queryset().active()


class Purchase(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        EXPIRED = "expired", "Expired"
        CANCELED = "canceled", "Canceled"

    raffle: models.ForeignKey[Raffle]
    customer: models.ForeignKey[User]

    raffle = models.ForeignKey(
        "raffles.Raffle",
        on_delete=models.PROTECT,
        related_name="purchases",
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="raffle_purchases",
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))]
    )
    reserved_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(default=_default_expires_at)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects: ClassVar[PurchaseManager] = PurchaseManager()

    class Meta:
        constraints = (
            models.CheckConstraint(
                condition=models.Q(expires_at__gt=models.F("reserved_at")),
                name="purchase_expires_after_reserved",
            ),
        )
        ordering = ("-created_at",)

    def __str__(self) -> str:
        raffle_ref = getattr(self, "raffle_id", None)
        return f"Purchase #{self.pk} for raffle {raffle_ref or 'unknown'}"


class PurchaseDetail(models.Model):
    purchase: models.ForeignKey[Purchase]

    purchase = models.ForeignKey(
        Purchase,
        on_delete=models.CASCADE,
        related_name="details",
    )
    number = models.PositiveIntegerField()
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = (
            models.UniqueConstraint(
                fields=("purchase", "number"),
                name="unique_number_per_purchase",
            ),
        )
        ordering = ("number",)

    def __str__(self) -> str:
        purchase_ref = getattr(self, "purchase_id", None)
        return f"Number {self.number} for purchase {purchase_ref or 'unknown'}"


class Payment(models.Model):
    purchase: models.ForeignKey[Purchase]
    created_by: models.ForeignKey[User]

    purchase = models.ForeignKey(
        Purchase,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    payment_date = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payments_recorded",
        null=True,
        blank=True,
    )

    def __str__(self) -> str:
        purchase_ref = getattr(self, "purchase_id", None)
        return f"Payment #{self.pk} for purchase {purchase_ref or 'unknown'}"


class OnlinePayment(models.Model):
    payment: models.OneToOneField[Payment]

    class Gateway(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        PAYPAL = "paypal", "PayPal"

    payment = models.OneToOneField(
        Payment, on_delete=models.CASCADE, primary_key=True, related_name="online"
    )
    gateway_tx_id = models.CharField(max_length=255)
    gateway_name = models.CharField(max_length=32, choices=Gateway.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.gateway_name} payment {self.gateway_tx_id}"


class PaymentWithReceipt(models.Model):
    payment: models.OneToOneField[Payment]
    verified_by: models.ForeignKey[User]

    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    payment = models.OneToOneField(
        Payment, on_delete=models.CASCADE, primary_key=True, related_name="receipt"
    )
    receipt_url = models.URLField()
    verification_status = models.CharField(
        max_length=16,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    verification_date = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="verified_payments",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        payment_ref = getattr(self, "payment_id", None)
        return f"Receipt for payment {payment_ref or 'unknown'}"

    def mark_verified(self, status: str, verified_at: datetime | None = None) -> None:
        self.verification_status = status
        self.verification_date = verified_at or timezone.now()
        self.save(update_fields=["verification_status", "verification_date"])
