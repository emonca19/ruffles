from django.urls import path

from .views import OrganizerRaffleListView, RaffleListView

urlpatterns = [
    path("", RaffleListView.as_view(), name="raffle-list"),
    path("organizer/", OrganizerRaffleListView.as_view(), name="organizer-raffle-list"),
]
