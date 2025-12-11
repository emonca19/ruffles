import re
from typing import TYPE_CHECKING, Any, ClassVar, cast

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from django.utils import timezone

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, parsers, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Payment, PaymentWithReceipt, Purchase
from .serializers import (
    PaymentReceiptSerializer,
    PurchaseCancellationSerializer,
    PurchaseReadSerializer,
    ReservationSerializer,
    VerificationActionSerializer,
    VerificationReadSerializer,
)
from .services import create_reservation

if TYPE_CHECKING:
    from apps.authentication.models import User


@extend_schema(
    tags=["Purchases"],
    summary="Create a new reservation",
    description="Allows authenticated users or guests to reserve numbers for a raffle.",
    request=ReservationSerializer,
    responses={201: PurchaseReadSerializer},
)
class PurchaseViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet
):
    queryset = Purchase.objects.all()
    serializer_class = ReservationSerializer
    permission_classes: ClassVar[list[Any]] = [permissions.AllowAny]  # Allow guests
    pagination_class = None

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "upload_receipt":
            return PaymentReceiptSerializer
        if self.action in ["list", "retrieve"]:
            return PurchaseReadSerializer
        return ReservationSerializer

    @extend_schema(
        tags=["Purchases"],
        summary="List purchases",
        description="List purchases. Guests must provide 'phone'. Authenticated users see their own or can filter by 'phone'.",
        parameters=[
            OpenApiParameter(
                name="phone",
                description="Phone number to filter by (required for guests)",
                required=False,
                type=str,
            )
        ],
        responses=PurchaseReadSerializer(many=True),
    )
    def list(self, request: Request, *args: object, **kwargs: object) -> Response:
        return super().list(request, *args, **kwargs)

    def get_queryset(self) -> QuerySet[Purchase]:
        user = self.request.user
        phone = self.request.query_params.get("phone")

        # Validate phone format if provided
        # Validate phone format if provided
        if phone and not re.match(r"^\d{10}$", phone):
            raise ValidationError(
                {"phone": "Ingrese un número de teléfono válido de 10 dígitos."}
            )

        queryset = Purchase.objects.select_related("raffle").prefetch_related("details")

        if user.is_authenticated:
            user = cast("User", user)
            # Organizer: Allow full access (or filtered by their raffles if needed)
            if user.user_type == "organizer":
                return queryset.order_by("-created_at")

            # Customer logic
            if phone:
                # If phone provided, look up guest purchases (or their own if matched)
                return queryset.filter(guest_phone=phone).order_by("-created_at")
            # Default: show own purchases
            return queryset.filter(customer=user).order_by("-created_at")

        # Guest logic
        if not phone:
            raise ValidationError(
                {"phone": "Se requiere un número de teléfono para acceso de invitados."}
            )

        return queryset.filter(guest_phone=phone).order_by("-created_at")

    def create(self, request: Request, *args: object, **kwargs: object) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        guest_info = {
            "guest_name": data.get("guest_name", ""),
            "guest_phone": data.get("guest_phone", ""),
            "guest_email": data.get("guest_email", ""),
        }

        try:
            purchase = create_reservation(
                user=cast(Any, request.user),
                raffle_id=data["raffle_id"],
                numbers=data["numbers"],
                guest_info=guest_info,
            )
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)

        read_serializer = PurchaseReadSerializer(purchase, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        tags=["Purchases"],
        summary="Upload payment receipt",
        description="Upload a receipt image for a purchase. Guests must provide 'phone'.",
        request=PaymentReceiptSerializer,
        responses={201: None},
    )
    @action(
        detail=True,
        methods=["post"],
        serializer_class=PaymentReceiptSerializer,
        parser_classes=[parsers.MultiPartParser],
        url_path="upload_receipt",
    )
    @action(
        detail=True,
        methods=["post"],
        serializer_class=PaymentReceiptSerializer,
        parser_classes=[parsers.MultiPartParser],
        url_path="upload_receipt",
    )
    def upload_receipt(self, request: Request, pk: int | None = None) -> Response:
        purchase = get_object_or_404(Purchase, pk=pk)
        user = request.user
        phone = request.data.get("phone")

        # Permission check
        if user.is_authenticated:
            if purchase.customer != user:
                raise PermissionDenied(
                    "No tienes permiso para subir un comprobante para esta compra."
                )
        else:
            if not phone or purchase.guest_phone != phone:
                raise PermissionDenied(
                    "Número de teléfono inválido para esta reservación."
                )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        receipt_image = serializer.validated_data["receipt_image"]
        numbers = serializer.validated_data[
            "numbers"
        ]  # 🔹 SOLO los números seleccionados

        # 🔹 Validar que esos números pertenezcan a la compra
        valid_numbers = set(purchase.details.values_list("number", flat=True))
        if not set(numbers).issubset(valid_numbers):
            raise ValidationError(
                {"numbers": "Los números enviados no pertenecen a esta reservación."}
            )

        # 🔹 Calcular el monto en base a los números seleccionados
        first_detail = purchase.details.first()
        if not first_detail:
            raise ValidationError("La compra no tiene boletos asociados.")

        price_per_number = first_detail.unit_price
        amount = len(numbers) * price_per_number

        # 🔹 Crear el pago parcial
        payment = Payment.objects.create(
            purchase=purchase,
            amount=amount,
            created_by=user if user.is_authenticated else None,
        )

        PaymentWithReceipt.objects.create(
            payment=payment,
            receipt_image=receipt_image,
            selected_numbers=numbers,
        )

        all_numbers = set(purchase.details.values_list("number", flat=True))

        paid_numbers = set(
            purchase.details.filter(status=Purchase.Status.PAID).values_list(
                "number", flat=True
            )
        )

        pending_receipts = PaymentWithReceipt.objects.filter(
            payment__purchase=purchase,
            verification_status=PaymentWithReceipt.VerificationStatus.PENDING,
        )
        processing_numbers = set()
        for receipt in pending_receipts:
            processing_numbers.update(receipt.selected_numbers)

        remaining_numbers = list(all_numbers - paid_numbers - processing_numbers)
        remaining_numbers.sort()

        return Response(
            {
                "detail": "Comprobante subido exitosamente.",
                "remaining_numbers": remaining_numbers,
            },
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        tags=["Purchases"],
        summary="Cancel a reservation",
        description="Cancel a pending reservation. Allowed for Organizer, Owner, or Guest (with phone).",
        request=PurchaseCancellationSerializer,
        responses={200: None},
    )
    @action(detail=True, methods=["post"])
    def cancel(self, request: Request, pk: int | None = None) -> Response:
        purchase = get_object_or_404(Purchase, pk=pk)
        user = request.user
        phone = request.data.get("phone")

        # Permission check
        has_permission = False
        if user.is_authenticated:
            user = cast("User", user)
            # Organizer or Owner
            if user.user_type == "organizer" or purchase.customer == user:
                has_permission = True
        else:
            # Guest check
            if phone and purchase.guest_phone == phone:
                has_permission = True

        if not has_permission:
            raise PermissionDenied("No tienes permiso para cancelar esta reservación.")

        # Validation
        if purchase.status == Purchase.Status.PAID:
            raise ValidationError("No se puede cancelar una compra pagada.")

        # Idempotency / Action
        if purchase.status == Purchase.Status.CANCELED:
            return Response(
                {"detail": "La compra ya fue cancelada."}, status=status.HTTP_200_OK
            )

        # Reject any pending payment receipts to release the reservation cleanly.
        for payment in purchase.payments.all():  # type: ignore
            try:
                # Access OneToOne related receipt
                receipt = payment.receipt
                if (
                    receipt.verification_status
                    == PaymentWithReceipt.VerificationStatus.PENDING
                ):
                    receipt.mark_verified(
                        PaymentWithReceipt.VerificationStatus.REJECTED,
                        verified_at=timezone.now(),
                    )
                    if user.is_authenticated:
                        receipt.verified_by = user
                        receipt.save(update_fields=["verified_by"])
            except PaymentWithReceipt.DoesNotExist:
                continue  # Payment has no receipt (e.g., online payment or incomplete)

        purchase.details.update(status=Purchase.Status.CANCELED)
        purchase.update_status_from_details()

        return Response(status=status.HTTP_200_OK)


@extend_schema(
    tags=["Purchases"],
    summary="List pending verifications",
    description="List all payments requiring verification. Organizer only.",
    responses=serializers.ListSerializer(child=VerificationReadSerializer()),
)
class VerificationViewSet(viewsets.GenericViewSet):
    permission_classes: ClassVar[list[Any]] = [permissions.IsAuthenticated]

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.action == "verify":
            # Debería devolver la clase real, no un placeholder
            return VerificationActionSerializer 
        # Debería devolver la clase real, no un placeholder
        return VerificationReadSerializer 

    def get_queryset(self) -> QuerySet[PaymentWithReceipt]:
        user = cast("User", self.request.user)
        if (
            not user.is_authenticated or user.user_type != "organizer"
        ):  # basic check, refined permissions maybe better
            return PaymentWithReceipt.objects.none()

        return (
            PaymentWithReceipt.objects.select_related(
                "payment",
                "payment__purchase",
                "payment__purchase__raffle",
                "payment__purchase__customer",
            )
            .filter(verification_status=PaymentWithReceipt.VerificationStatus.PENDING)
            .order_by("payment__payment_date")
        )

    def list(self, request: Request, *args: object, **kwargs: object) -> Response:
        user = cast("User", request.user)
        if user.user_type != "organizer":
            return Response(status=status.HTTP_403_FORBIDDEN)

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=["Purchases"],
        summary="Verify payment receipt",
        description="Approve or reject a payment receipt.",
        request=VerificationActionSerializer,
        responses={200: VerificationReadSerializer},
        parameters=[OpenApiParameter("id", int, location=OpenApiParameter.PATH)],
    )
    @action(detail=True, methods=["post"])
    def verify(self, request: Request, pk: int | None = None) -> Response:
        user = cast("User", request.user)
        if user.user_type != "organizer":
            return Response(status=status.HTTP_403_FORBIDDEN) # Error 403 si no es organizador

        # 1. Obtener el comprobante (receipt)
        receipt = get_object_or_404(PaymentWithReceipt, pk=pk)

        # 2. Validar datos de la acción (approve/reject)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_val = serializer.validated_data["action"]

        # 🌟🌟🌟 CORRECCIÓN 1: Definir 'purchase' (solución del 500 anterior) 🌟🌟🌟
        purchase = receipt.payment.purchase
        
        # 🌟🌟🌟 CORRECCIÓN 2: Obtener los números del modelo PaymentWithReceipt 🌟🌟🌟
        # Estos son los números que el usuario subió con ese comprobante específico.
        selected_numbers = receipt.selected_numbers
        
        # Aseguramos que sea una lista/iterable
        if not isinstance(selected_numbers, list):
             selected_numbers = []


        if action_val == "approve":
            # 1. Update status of selected numbers to PAID
            if selected_numbers: # Solo actualiza si hay números seleccionados
                purchase.details.filter(number__in=selected_numbers).update(
                    status=Purchase.Status.PAID
                )

            # 2. Marcar el comprobante como APROBADO
            receipt.mark_verified(
                PaymentWithReceipt.VerificationStatus.APPROVED,
                verified_at=timezone.now(),
            )
            receipt.verified_by = user
            receipt.save()

            # 3. Sync parent purchase status
            purchase.update_status_from_details()

        elif action_val == "reject":
            # 1. Marcar el comprobante como RECHAZADO
            receipt.mark_verified(
                PaymentWithReceipt.VerificationStatus.REJECTED,
                verified_at=timezone.now(),
            )
            receipt.verified_by = user
            receipt.save()

            # 2. Revertir los números seleccionados en ESTE comprobante a PENDING (Apartado).
            if selected_numbers: # Solo revierte si hay números seleccionados
                purchase.details.filter(number__in=selected_numbers).update(
                    status=Purchase.Status.PENDING 
                )

            # 3. Sincronizar el estado de la compra padre
            purchase.update_status_from_details()

        # 4. Devolver la respuesta
        return Response(VerificationReadSerializer(receipt).data)