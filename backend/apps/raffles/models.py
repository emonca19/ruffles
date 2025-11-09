from datetime import datetime
from typing import Self

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class RaffleQuerySet(models.QuerySet["Raffle"]):
    def active(self) -> Self:
        return self.filter(deleted_at__isnull=True)

    def currently_on_sale(self) -> Self:
        now = timezone.now()
        return self.active().filter(sale_start_at__lte=now, sale_end_at__gte=now)

    def upcoming(self) -> Self:
        return self.active().filter(sale_start_at__gt=timezone.now())


class Raffle(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    image_url = models.URLField(blank=True)

    number_start = models.PositiveIntegerField()
    number_end = models.PositiveIntegerField()
    price_per_number = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )

    sale_start_at = models.DateTimeField()
    sale_end_at = models.DateTimeField()
    draw_scheduled_at = models.DateTimeField()
    winner_number = models.PositiveIntegerField(null=True, blank=True)

    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="organized_raffles",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="raffles_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="raffles_updated",
    )
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = RaffleQuerySet.as_manager()

    class Meta:
        app_label = "raffles"
        ordering = ("-created_at",)
        constraints = (
            models.CheckConstraint(
                condition=models.Q(number_start__lt=models.F("number_end")),
                name="raffle_number_range_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(sale_start_at__lt=models.F("sale_end_at")),
                name="raffle_sale_window_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(sale_end_at__lt=models.F("draw_scheduled_at")),
                name="raffle_draw_after_sale",
            ),
        )

    def __str__(self) -> str:
        return self.name

    def clean(self) -> None:
        super().clean()
        errors = {}

        if (
            self.number_start is not None
            and self.number_end is not None
            and self.number_start >= self.number_end
        ):
            errors["number_end"] = "End number must be greater than start number."

        if (
            self.sale_start_at
            and self.sale_end_at
            and self.sale_end_at <= self.sale_start_at
        ):
            errors["sale_end_at"] = "Sale end date must be after sale start date."

        if (
            self.sale_end_at
            and self.draw_scheduled_at
            and self.draw_scheduled_at <= self.sale_end_at
        ):
            errors["draw_scheduled_at"] = "Draw date must be after sale end date."

        if self.winner_number is not None:
            range_known = self.number_start is not None and self.number_end is not None
            if range_known and not (
                self.number_start <= self.winner_number <= self.number_end
            ):
                errors["winner_number"] = (
                    "Winner number must fall within the configured range."
                )

        if errors:
            raise ValidationError(errors)

    def mark_deleted(self, timestamp: datetime | None = None) -> None:
        self.deleted_at = timestamp or timezone.now()
        self.save(update_fields=["deleted_at"])

    @property
    def is_on_sale(self) -> bool:
        if self.deleted_at is not None:
            return False
        now = timezone.now()
        return self.sale_start_at <= now <= self.sale_end_at

    @property
    def has_winner(self) -> bool:
        return self.winner_number is not None
