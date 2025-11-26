from typing import Any, ClassVar

from django.core.exceptions import ValidationError as DjangoValidationError

from drf_spectacular.utils import extend_schema
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Purchase
from .serializers import ReservationSerializer
from .services import create_reservation


@extend_schema(
    tags=["Purchases"],
    summary="Create a new reservation",
    description="Allows authenticated users or guests to reserve numbers for a raffle.",
    request=ReservationSerializer,
    responses={201: ReservationSerializer},  # Todo: Update response schema
)
class PurchaseViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = Purchase.objects.all()
    serializer_class = ReservationSerializer
    permission_classes: ClassVar[list[Any]] = [permissions.AllowAny]  # Allow guests

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
