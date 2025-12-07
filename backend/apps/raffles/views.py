from datetime import datetime
from typing import cast

from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from django.utils import timezone

from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, serializers, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Raffle
from .serializers import (
    OrganizerRaffleSerializer,
    OrganizerRaffleWriteSerializer,
    PublicRaffleSerializer,
    RaffleAvailabilitySerializer,
)
from .services import RaffleAvailability, get_raffle_availability


def _parse_bool_param(value: str | None) -> bool | None:
    if value is None:
        return None
    value = value.strip().lower()
    if value in {"1", "true", "yes", "on"}:
        return True
    if value in {"0", "false", "no", "off"}:
        return False
    return None


def _filter_queryset_by_state(
    queryset: QuerySet[Raffle],
    state: str | None,
    *,
    now: datetime,
    allow_archived: bool = False,
) -> QuerySet[Raffle]:
    if not state:
        return queryset
    state = state.lower()
    if state == "upcoming":
        return queryset.filter(winner_number__isnull=True, sale_start_at__gt=now)
    if state == "selling":
        return queryset.filter(
            winner_number__isnull=True, sale_start_at__lte=now, sale_end_at__gte=now
        )
    if state == "closed":
        return queryset.filter(
            winner_number__isnull=True,
            sale_end_at__lt=now,
            draw_scheduled_at__gte=now,
        )
    if state == "completed":
        return queryset.filter(winner_number__isnull=False)
    if state == "archived" and allow_archived:
        return queryset.filter(deleted_at__isnull=False)
    return queryset


class RafflePagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 60


class RaffleDetailView(generics.RetrieveAPIView):
    def get_queryset(self) -> QuerySet[Raffle]:
        return Raffle.objects.filter(deleted_at__isnull=True)

    serializer_class = PublicRaffleSerializer
    permission_classes = (permissions.AllowAny,)


@extend_schema(
    tags=["Raffles"],
    summary="List public raffles",
    description="Returns a paginated list of raffles with optional state/on_sale filters.",
)
class RaffleListView(generics.ListAPIView):
    request: Request
    serializer_class = PublicRaffleSerializer
    pagination_class = RafflePagination
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self) -> QuerySet[Raffle]:
        request = cast(Request, self.request)
        now = timezone.now()
        queryset = (
            Raffle.objects.active()
            .select_related("organizer")
            .order_by("sale_start_at", "id")
        )

        state = request.query_params.get("state")
        queryset = _filter_queryset_by_state(queryset, state, now=now)

        on_sale = _parse_bool_param(request.query_params.get("on_sale"))
        if on_sale is True:
            queryset = queryset.filter(
                winner_number__isnull=True, sale_start_at__lte=now, sale_end_at__gte=now
            )
        elif on_sale is False:
            queryset = queryset.exclude(
                winner_number__isnull=True, sale_start_at__lte=now, sale_end_at__gte=now
            )

        return queryset


@extend_schema(
    tags=["Raffles"],
    summary="Retrieve raffle availability",
    description="Shows ticket availability and sold counts for a specific raffle.",
)
class RaffleAvailabilityView(generics.RetrieveAPIView):
    serializer_class = RaffleAvailabilitySerializer
    permission_classes = (permissions.AllowAny,)

    def get_object(self) -> RaffleAvailability:
        raffle = get_object_or_404(Raffle.objects.active(), pk=self.kwargs["pk"])
        return get_raffle_availability(raffle)


@extend_schema(
    tags=["Raffles"],
    summary="List or create organizer raffles",
    description="Authenticated organizers can list their raffles or create a new one. Creating requires multipart/form-data for image upload.",
    request=OrganizerRaffleWriteSerializer,
    responses=OrganizerRaffleSerializer,
)
class OrganizerRaffleListView(generics.ListCreateAPIView):
    request: Request
    serializer_class = OrganizerRaffleSerializer
    pagination_class = RafflePagination
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser,)

    def get_queryset(self) -> QuerySet[Raffle]:
        request = cast(Request, self.request)
        now = timezone.now()
        include_deleted = _parse_bool_param(request.query_params.get("include_deleted"))

        queryset = (
            Raffle.objects.select_related("organizer", "created_by", "updated_by")
            .filter(organizer=request.user)
            .order_by("-created_at")
        )

        if include_deleted is not True:
            queryset = queryset.filter(deleted_at__isnull=True)

        state = request.query_params.get("state")
        queryset = _filter_queryset_by_state(
            queryset, state, now=now, allow_archived=include_deleted is True
        )

        return queryset

    def get_serializer_class(self) -> type[serializers.Serializer]:
        if self.request.method == "POST":
            return OrganizerRaffleWriteSerializer
        return super().get_serializer_class()  # type: ignore[return-value]

    def perform_create(self, serializer: OrganizerRaffleWriteSerializer) -> None:
        serializer.save()

    def create(self, request: Request, *args: object, **kwargs: object) -> Response:
        """Create using the write-serializer, then return the read-serializer
        representation so the response includes read-only fields like `id`.
        """
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        self.perform_create(cast(OrganizerRaffleWriteSerializer, write_serializer))
        read_serializer = OrganizerRaffleSerializer(
            write_serializer.instance, context=self.get_serializer_context()
        )
        headers = self.get_success_headers(read_serializer.data)
        return Response(
            read_serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


@extend_schema(
    tags=["Raffles"],
    summary="Retrieve raffle manifest",
    description="Returns a detailed list of all taken numbers for a raffle. Only accessible by the organizer.",
)
class RaffleManifestView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = None  # Return all numbers at once

    def get_serializer_class(self) -> type[serializers.Serializer]:
        from apps.purchases.serializers import PurchaseManifestSerializer

        return PurchaseManifestSerializer

    def get_queryset(self) -> QuerySet:
        from apps.purchases.models import Purchase, PurchaseDetail

        raffle = get_object_or_404(Raffle, pk=self.kwargs["pk"])

        # Check permission: Only the organizer can view the manifest
        if raffle.organizer != self.request.user:
            self.permission_denied(
                self.request,
                message="No tienes permiso para ver este manifiesto.",
            )

        return (
            PurchaseDetail.objects.filter(purchase__raffle=raffle)
            .select_related("purchase", "purchase__customer")
            .exclude(purchase__status=Purchase.Status.CANCELED)
            .exclude(purchase__status=Purchase.Status.EXPIRED)
            .order_by("number")
        )
