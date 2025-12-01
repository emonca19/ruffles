from typing import Any, ClassVar, cast

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import QuerySet

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, permissions, serializers, status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Purchase
from .serializers import PurchaseReadSerializer, ReservationSerializer
from .services import create_reservation


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
        import re

        from rest_framework.exceptions import ValidationError

        user = self.request.user
        phone = self.request.query_params.get("phone")

        # Validate phone format if provided
        if phone and not re.match(r"^\d{10}$", phone):
            raise ValidationError({"phone": "Enter a valid 10-digit phone number."})

        queryset = Purchase.objects.select_related("raffle").prefetch_related("details")

        if user.is_authenticated:
            # Organizer/Customer logic
            if phone:
                # If phone provided, look up guest purchases (or their own if matched)
                return queryset.filter(guest_phone=phone).order_by("-created_at")
            # Default: show own purchases
            return queryset.filter(customer=user).order_by("-created_at")

        # Guest logic
        if not phone:
            raise ValidationError(
                {"phone": "Phone number is required for guest access."}
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

        # Return the ReadSerializer representation
        read_serializer = PurchaseReadSerializer(purchase)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
