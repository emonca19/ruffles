from django.urls import path

from .views import OrganizerRaffleListView, RaffleListView, RaffleAvailabilityView

urlpatterns = [
	path("", RaffleListView.as_view(), name="raffle-list"),
	path("<int:pk>/availability/", RaffleAvailabilityView.as_view(), name="raffle-availability"),
	path("organizer/", OrganizerRaffleListView.as_view(), name="organizer-raffle-list"),
]
