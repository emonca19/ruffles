from datetime import datetime
from typing import cast

from django.db.models import QuerySet
from django.utils import timezone

from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request

from .models import Raffle
from .serializers import OrganizerRaffleSerializer, PublicRaffleSerializer


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


class OrganizerRaffleListView(generics.ListAPIView):
    request: Request
    serializer_class = OrganizerRaffleSerializer
    pagination_class = RafflePagination
    permission_classes = (permissions.IsAuthenticated,)

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
