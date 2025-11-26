from typing import Any, ClassVar

from django.core.exceptions import ValidationError as DjangoValidationError

from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Purchase
from .serializers import ReservationSerializer
from .services import create_reservation


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    # We'll use a basic serializer for reading, but for now let's just use ReservationSerializer for write
    # In reality you'd want a ReadSerializer.
    serializer_class = ReservationSerializer
    permission_classes: ClassVar[list[Any]] = [permissions.AllowAny]  # Allow guests

    def get_serializer_class(self) -> type[ReservationSerializer]:
        if self.action == "create":
            return ReservationSerializer
        # Fallback or Read Serializer
        return ReservationSerializer

    @extend_schema(
        request=ReservationSerializer,
        responses={201: ReservationSerializer},  # Todo: Update response schema
    )
    def create(self, request: Request, *args: object, **kwargs: object) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        guest_info = {
            "guest_name": data.get("guest_name"),
            "guest_phone": data.get("guest_phone"),
            "guest_email": data.get("guest_email"),
        }

        try:
            purchase = create_reservation(
                user=request.user,
                raffle_id=data["raffle_id"],
                numbers=data["numbers"],
                guest_info=guest_info,
            )
        except DjangoValidationError as e:
            return Response({"detail": e.message}, status=status.HTTP_400_BAD_REQUEST)

        # Ideally return a ReadSerializer representation
        return Response(
            {
                "id": purchase.id,
                "status": purchase.status,
                "total_amount": purchase.total_amount,
            },
            status=status.HTTP_201_CREATED,
        )
