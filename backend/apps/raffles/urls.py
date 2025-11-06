from django.urls import path
from .views import RaffleListView, OrganizerRaffleListView

urlpatterns = [
    path("", RaffleListView.as_view(), name="raffle-list"),
    path("organizer/", OrganizerRaffleListView.as_view(), name="organizer-raffle-list"),
]
