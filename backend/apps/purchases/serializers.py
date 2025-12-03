from typing import Any, ClassVar

from django.core.validators import RegexValidator

from rest_framework import serializers

from .models import PaymentWithReceipt, Purchase, PurchaseDetail


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
        request = self.context.get("request")
        is_authenticated = request.user.is_authenticated if request else False

        # If user is not authenticated, guest_phone is required
        if not is_authenticated and not attrs.get("guest_phone"):
            raise serializers.ValidationError(
                {"guest_phone": "Guest phone number is required for guest purchases."}
            )

        return attrs

    def validate_numbers(self, value: list[int]) -> list[int]:
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate numbers are not allowed.")
        return value


class PurchaseDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseDetail
        fields: ClassVar[list[str]] = ["number", "unit_price"]


class PurchaseReadSerializer(serializers.ModelSerializer):
    raffle_name = serializers.CharField(source="raffle.name", read_only=True)
    raffle_status = serializers.SerializerMethodField()
    draw_scheduled_at = serializers.DateTimeField(
        source="raffle.draw_scheduled_at", read_only=True
    )
    raffle_image = serializers.ImageField(source="raffle.image", read_only=True)
    details = PurchaseDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Purchase
        fields: ClassVar[list[str]] = [
            "id",
            "raffle_id",
            "raffle_name",
            "raffle_status",
            "draw_scheduled_at",
            "status",
            "total_amount",
            "reserved_at",
            "expires_at",
            "details",
            "guest_name",
            "guest_phone",
            "raffle_image",
        ]

    def get_raffle_status(self, obj: Purchase) -> str:
        # Simple status derivation for the UI
        if obj.raffle.winner_number:
            return "completed"
        if obj.raffle.is_on_sale:
            return "selling"
        return "closed"


class PaymentReceiptSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = PaymentWithReceipt
        fields: ClassVar[list[str]] = ["receipt_image", "phone"]
        extra_kwargs: ClassVar[dict[str, Any]] = {"receipt_image": {"required": True}}


class PurchaseManifestSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source="purchase.status", read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    reserved_at = serializers.DateTimeField(
        source="purchase.reserved_at", read_only=True
    )
    expires_at = serializers.DateTimeField(source="purchase.expires_at", read_only=True)
    purchase_id = serializers.IntegerField(source="purchase.id", read_only=True)

    class Meta:
        model = PurchaseDetail
        fields: ClassVar[list[str]] = [
            "number",
            "status",
            "customer_name",
            "customer_phone",
            "customer_email",
            "reserved_at",
            "expires_at",
            "purchase_id",
        ]

    def get_customer_name(self, obj: PurchaseDetail) -> str:
        purchase = obj.purchase
        if purchase.customer:
            # User model appears to use 'name' or just email if name is missing
            return getattr(purchase.customer, "name", "") or purchase.customer.email
        return purchase.guest_name

    def get_customer_phone(self, obj: PurchaseDetail) -> str:
        purchase = obj.purchase
        return purchase.guest_phone

    def get_customer_email(self, obj: PurchaseDetail) -> str:
        purchase = obj.purchase
        if purchase.customer:
            return purchase.customer.email
        return purchase.guest_email
