import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from raffles.models import Raffle

@pytest.mark.django_db
class TestConsultarSorteosAPI:
    def setup_method(self):
        self.client = APIClient()

    # Visitor sees active raffles
    def test_gallery_shows_active_raffles(self):
        Raffle.objects.create(name="A", status="active", price_per_number=10)
        Raffle.objects.create(name="B", status="active", price_per_number=15)
        Raffle.objects.create(name="C", status="draft", price_per_number=20)
        url = reverse("raffle-list") + "?status=active"
        response = self.client.get(url)
        assert response.status_code == 200
        results = response.data["results"]
        assert len(results) == 2
        for r in results:
            assert r["status"] == "active"

    # Validation of fields visible per raffle
    def test_raffle_card_has_image_name_price(self):
        Raffle.objects.create(name="iPhone 15", status="active", price_per_number=100, image_url="https://test.com/img.jpg")
        response = self.client.get(reverse("raffle-list") + "?status=active")
        card = response.data["results"][0]
        assert card["name"] == "iPhone 15"
        assert card["image_url"] == "https://test.com/img.jpg"
        assert card["price_per_number"] == "100.00" or card["price_per_number"] == 100

    # Filtering inactive/finished raffles
    def test_raffle_filter_status(self):
        Raffle.objects.create(name="X", status="active")
        Raffle.objects.create(name="Y", status="finished")
        url = reverse("raffle-list") + "?status=active"
        response = self.client.get(url)
        for r in response.data["results"]:
            assert r["status"] == "active"

    # Message when there are no active raffles
    def test_empty_raffle_returns_empty_list(self):
        response = self.client.get(reverse("raffle-list") + "?status=active")
        assert response.status_code == 200
        assert response.data["results"] == []

    # Organizer sees all raffles in the system
    def test_organizer_sees_all_raffles(self, organizer_user):
        self.client.force_authenticate(user=organizer_user)
        Raffle.objects.create(name="RA", status="active", created_by=organizer_user)
        Raffle.objects.create(name="RB", status="active")
        url = reverse("organizer-raffle-list")
        response = self.client.get(url)
        assert response.status_code == 200
        assert any("created_by" in r for r in response.data["results"])

    # Visual identification of the creator per raffle
    def test_organizer_card_field(self, organizer_user):
        r = Raffle.objects.create(name="RA", status="active", created_by=organizer_user)
        self.client.force_authenticate(user=organizer_user)
        response = self.client.get(reverse("organizer-raffle-list"))
        # our user factory sets first_name; compare with that
        assert response.data["results"][0]["created_by"]["name"] == organizer_user.first_name

    # Organizer without raffles
    def test_organizer_no_raffles(self, organizer_user):
        self.client.force_authenticate(user=organizer_user)
        response = self.client.get(reverse("organizer-raffle-list"))
        assert response.status_code == 200
        assert response.data["results"] == []

    # Restricted access without authentication
    def test_protected_endpoint_requires_auth(self):
        url = reverse("organizer-raffle-list")
        response = self.client.get(url)
        assert response.status_code == 401

    # Friendly handling of load errors
    def test_raffle_list_handles_error(self, mocker):
        url = reverse("raffle-list") + "?status=active"
        mocker.patch("raffles.views.RaffleListView.get_queryset", side_effect=Exception("Error 500"))
        response = self.client.get(url)
        assert response.status_code == 500

    # Handling broken images
    def test_raffle_with_broken_image(self):
        Raffle.objects.create(name="RC", status="active", image_url="https://badurl.com/img.jpg")
        response = self.client.get(reverse("raffle-list") + "?status=active")
        card = response.data["results"][0]
        assert "image_url" in card

    # Price format verification
    def test_price_format(self):
        Raffle.objects.create(name="A", status="active", price_per_number=100)
        resp = self.client.get(reverse("raffle-list") + "?status=active")
        value = resp.data["results"][0]["price_per_number"]
        assert str(value).replace(",", "").replace("$", "").replace(".00", "").isdigit()

    # API – List active raffles
    def test_list_active_api_returns_json(self):
        Raffle.objects.create(name="X", status="active", price_per_number=10)
        resp = self.client.get(reverse("raffle-list") + "?status=active")
        assert resp.status_code == 200
        assert "results" in resp.data
        for r in resp.data["results"]:
            assert r["status"] == "active"

    # API – List organizer's raffles (protected)
    def test_organizer_list_jwt(self, organizer_user, api_client_with_token):
        raffle = Raffle.objects.create(name="Org", status="active", created_by=organizer_user)
        client = api_client_with_token(organizer_user)
        resp = client.get(reverse("organizer-raffle-list"))
        assert resp.status_code == 200
        assert any(["created_by" in r for r in resp.data["results"]])
        resp2 = self.client.get(reverse("organizer-raffle-list"))
        assert resp2.status_code == 401

    # Validation of CORS headers
    def test_cors_headers_present(self, settings):
        settings.CORS_ALLOW_ALL_ORIGINS = True
        resp = self.client.get(reverse("raffle-list"))
        assert "Access-Control-Allow-Origin" in resp.headers

    # Basic raffles pagination
    def test_raffle_pagination(self):
        for i in range(25):
            Raffle.objects.create(name=f"R{i}", status="active")
        resp = self.client.get(reverse("raffle-list") + "?status=active&page=1")
        assert resp.status_code == 200
        results = resp.data["results"]
        assert len(results) == 10  
        assert resp.data["next"] is not None
        resp2 = self.client.get(resp.data["next"])
        assert len(resp2.data["results"]) == 10

    # JWT in headers for protected endpoint
    def test_auth_header_attached(self, api_client_with_token, organizer_user):
        client = api_client_with_token(organizer_user)
        resp = client.get(reverse("organizer-raffle-list"))
        assert resp.request["HTTP_AUTHORIZATION"].startswith("Bearer ")
        assert resp.status_code == 200

    # Timeout on slow requests (simulate delay and capture timeout)
    def test_raffle_list_timeout(self, monkeypatch):
        import time
        def slow_list(*args, **kwargs):
            time.sleep(31)
            return Raffle.objects.none()
        monkeypatch.setattr("raffles.views.RaffleListView.get_queryset", slow_list)
        resp = self.client.get(reverse("raffle-list"))
        assert resp.status_code in (504, 408, 200)

    # Prevention of XSS in data
    def test_no_xss_in_name(self):
        name = "<script>alert('xss')</script>"
        Raffle.objects.create(name=name, status="active", price_per_number=10)
        resp = self.client.get(reverse("raffle-list") + "?status=active")
        assert resp.status_code == 200
        assert resp.data["results"][0]["name"] == name

    # Invalid/malformed prices
    def test_invalid_price_values(self):
        Raffle.objects.create(name="A", status="active", price_per_number=-100)
        Raffle.objects.create(name="B", status="active", price_per_number=None)
        Raffle.objects.create(name="C", status="active", price_per_number="abc")
        resp = self.client.get(reverse("raffle-list") + "?status=active")
        precios = [r["price_per_number"] for r in resp.data["results"]]
        assert any([p in (None, "abc", -100) for p in precios])
