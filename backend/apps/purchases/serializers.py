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
            RegexValidator(
                r"^\d{10}$", "Ingrese un número de teléfono válido de 10 dígitos."
            )
        ],
    )
    guest_email = serializers.EmailField(required=False, allow_blank=True)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        request = self.context.get("request")
        is_authenticated = request.user.is_authenticated if request else False

        # If user is not authenticated, guest_phone is required
        if not is_authenticated and not attrs.get("guest_phone"):
            raise serializers.ValidationError(
                {
                    "guest_phone": "Se requiere un número de teléfono de invitado para compras de invitados."
                }
            )

        return attrs

    def validate_numbers(self, value: list[int]) -> list[int]:
        if len(value) != len(set(value)):
            raise serializers.ValidationError("No se permiten números duplicados.")
        return value


class PurchaseDetailSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PurchaseDetail
        # Incluir 'status' en los fields
        fields: ClassVar[list[str]] = ["number", "unit_price", "status"]


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


class PaymentReceiptSerializer(serializers.Serializer):
    receipt_image = serializers.ImageField()
    phone = serializers.CharField()
    numbers = serializers.ListField(
        child=serializers.IntegerField(),
        required=True
    )


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
        if purchase.guest_phone:
            return purchase.guest_phone
        if purchase.customer:
            return purchase.customer.phone
        return ""

    def get_customer_email(self, obj: PurchaseDetail) -> str:
        purchase = obj.purchase
        if purchase.customer:
            return purchase.customer.email
        return purchase.guest_email


class VerificationReadSerializer(serializers.ModelSerializer):
    """Serializer for displaying verification details to the organizer."""

    payment_id = serializers.IntegerField(source="payment.id", read_only=True)
    purchase_id = serializers.CharField(source="payment.purchase.id", read_only=True)
    raffle_name = serializers.CharField(
        source="payment.purchase.raffle.name", read_only=True
    )
    customer_name = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(
        source="payment.amount", max_digits=12, decimal_places=2, read_only=True
    )
    tickets = serializers.SerializerMethodField()
    payment_date = serializers.DateTimeField(
        source="payment.payment_date", read_only=True
    )
    status = serializers.CharField(source="verification_status", read_only=True)
    receipt_url = serializers.ImageField(source="receipt_image", read_only=True)

    class Meta:
        model = PaymentWithReceipt
        fields: ClassVar[list[str]] = [
            "payment_id",
            "purchase_id",
            "raffle_name",
            "customer_name",
            "total_amount",
            "tickets",
            "receipt_url",
            "payment_date",
            "status",
        ]

    def get_customer_name(self, obj: PaymentWithReceipt) -> str:
        purchase = obj.payment.purchase
        if purchase.customer:
            return getattr(purchase.customer, "name", "") or purchase.customer.email
        return purchase.guest_name

    def get_tickets(self, obj: PaymentWithReceipt) -> list[str]:
        if obj.selected_numbers:
            return [str(n).zfill(3) for n in obj.selected_numbers]
        
        return [
            str(detail.number).zfill(3)
            for detail in obj.payment.purchase.details.all()  # type: ignore
        ]



class PurchaseCancellationSerializer(serializers.Serializer):
    """Serializer for cancelling a reservation."""

    phone = serializers.CharField(
        required=False,
        help_text="Guest phone number (required if guest cancellation).",
    )


class VerificationActionSerializer(serializers.Serializer):
    """Serializer for the approve/reject action."""

    action = serializers.ChoiceField(choices=["approve", "reject"])
