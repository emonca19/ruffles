from django.urls import path

from .views import (
    OrganizerRaffleListView,
    RaffleAvailabilityView,
    RaffleDetailView,
    RaffleListView,
)

urlpatterns = [
    path("", RaffleListView.as_view(), name="raffle-list"),
    path("<int:pk>/", RaffleDetailView.as_view(), name="raffle-detail"),
    path(
        "<int:pk>/availability/",
        RaffleAvailabilityView.as_view(),
        name="raffle-availability",
    ),
    path("organizer/", OrganizerRaffleListView.as_view(), name="organizer-raffle-list"),
]
