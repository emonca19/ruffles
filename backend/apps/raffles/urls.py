from django.urls import path

from .views import (
    OrganizerRaffleListView,
    RaffleAvailabilityView,
    RaffleDetailView,
    RaffleListView,
    RaffleManifestView,
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
    path(
        "<int:pk>/manifest/",
        RaffleManifestView.as_view(),
        name="raffle-manifest",
    ),
]
