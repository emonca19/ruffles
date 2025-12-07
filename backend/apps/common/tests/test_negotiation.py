from django.urls import path

import pytest
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.test import APIClient
from rest_framework.views import APIView


# Define a simple view and serializer for testing
class ChoiceSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"])


class MockView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = ChoiceSerializer(data=request.data)
        if serializer.is_valid():
            return Response({"status": "ok"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# URL configuration for the test
urlpatterns = [
    path("mock_view/", MockView.as_view()),
]


@pytest.mark.django_db(transaction=True)
@pytest.mark.urls(__name__)
def test_ignore_accept_language_header(client):
    """
    Test that sending Accept-Language: en-US is IGNORED when LocaleMiddleware is removed,
    and the system defaults to Spanish (LANGUAGE_CODE = 'es-mx').
    """
    # Use the Django/DRF client to simulate a real request through the middleware stack
    client = APIClient()

    # Send request with Accept-Language: en-US
    response = client.post(
        "/mock_view/",
        {"action": "invalid_choice"},
        format="json",
        HTTP_ACCEPT_LANGUAGE="en-US",
    )

    assert response.status_code == 400
    errors = response.json()
    action_error = errors["action"][0]

    print(f"\nDEBUG (Header 'en-US'): {action_error}")

    # We expect SPANISH because middleware should be gone/disabled
    # "is not a valid choice" (English) vs "no es una elección válida" (Spanish)
    assert (
        "elección válida" in action_error or "opción válida" in action_error
    ), f"Expected Spanish error despite Accept-Language header, got: {action_error}"
