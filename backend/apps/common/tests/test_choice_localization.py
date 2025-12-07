import pytest
from rest_framework import serializers
from rest_framework.exceptions import ValidationError


class ChoiceSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"])


@pytest.mark.django_db
def test_spanish_choice_error():
    """
    Test that ChoiceField validation errors are returned in Spanish.
    Expected: "foo" no es una opción válida.
    """
    serializer = ChoiceSerializer(data={"action": "invalid_choice"})

    with pytest.raises(ValidationError):
        serializer.is_valid(raise_exception=True)

    if not serializer.is_valid():
        from django.conf import settings

        print(f"\nDEBUG: LANGUAGE_CODE={settings.LANGUAGE_CODE}")

        errors = serializer.errors
        action_errors = errors["action"]
        print(f"DEBUG: Choice errors: {action_errors}")

        # "is not a valid choice" -> "no es una opción válida" (standard DRF Spanish)
        assert any(
            "válida" in str(err) for err in action_errors
        ), f"Expected Spanish choice error, got: {action_errors}"
