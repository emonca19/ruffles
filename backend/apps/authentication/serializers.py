"""Serializers for authentication workflows."""

from __future__ import annotations

from typing import Any, ClassVar

from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields: ClassVar[list[str]] = [
            "id",
            "email",
            "name",
            "phone",
            "user_type",
            "date_joined",
            "updated_at",
        ]
        read_only_fields = fields


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields: ClassVar[list[str]] = [
            "email",
            "name",
            "phone",
            "user_type",
            "password",
        ]

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                _("A user with this email already exists.")
            )
        return value.lower()

    def create(self, validated_data: dict[str, Any]) -> User:
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
