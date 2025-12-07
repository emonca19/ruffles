import pytest
from rest_framework import serializers
from rest_framework.exceptions import ValidationError


class SimpleSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)


@pytest.mark.django_db
def test_spanish_error_message():
    """
    Test that validation errors are returned in Spanish (es-mx default).
    """
    serializer = SimpleSerializer(data={})

    with pytest.raises(ValidationError):
        serializer.is_valid(raise_exception=True)

    # Check the error message manually
    if not serializer.is_valid():
        from django.conf import settings

        print(f"\nDEBUG: LANGUAGE_CODE={settings.LANGUAGE_CODE}")
        errors = serializer.errors
        # The default "This field is required." in Spanish is usually "Este campo es obligatorio."
        # or similar. We check for a known Spanish keyword or the exact string.

        name_errors = errors["name"]
        print(f"DEBUG: Actual errors: {name_errors}")
        assert any(
            "obligatorio" in str(err) or "requerido" in str(err) for err in name_errors
        ), f"Expected Spanish error message containing 'obligatorio' or 'requerido', got: {name_errors}"
