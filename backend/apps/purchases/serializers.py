from typing import Any

from django.core.validators import RegexValidator

from rest_framework import serializers


class ReservationSerializer(serializers.Serializer):
    raffle_id = serializers.IntegerField()
    numbers = serializers.ListField(
        child=serializers.IntegerField(min_value=0), allow_empty=False
    )
    guest_name = serializers.CharField(required=False, allow_blank=True)
    guest_phone = serializers.CharField(
        required=False,
        allow_blank=True,
        min_length=10,
        max_length=10,
        validators=[
            RegexValidator(r"^\d{10}$", "Enter a valid 10-digit phone number.")
        ],
    )
    guest_email = serializers.EmailField(required=False, allow_blank=True)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        user = self.context.get("request").user

        # If user is not authenticated, guest_phone is required
        if not user.is_authenticated and not attrs.get("guest_phone"):
            raise serializers.ValidationError(
                {"guest_phone": "Guest phone number is required for guest purchases."}
            )

        return attrs

    def validate_numbers(self, value: list[int]) -> list[int]:
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate numbers are not allowed.")
        return value
