from typing import Any

from rest_framework import serializers


class ReservationSerializer(serializers.Serializer):
    raffle_id = serializers.IntegerField()
    numbers = serializers.ListField(
        child=serializers.IntegerField(min_value=0), allow_empty=False
    )
    guest_name = serializers.CharField(required=False, allow_blank=True)
    guest_phone = serializers.CharField(required=False, allow_blank=True)
    guest_email = serializers.EmailField(required=False, allow_blank=True)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        user = self.context.get("request").user

        # If user is not authenticated, guest_phone is required
        if not user.is_authenticated and not attrs.get("guest_phone"):
            raise serializers.ValidationError(
                {"guest_phone": "Guest phone number is required for guest purchases."}
            )

        return attrs
