"""Serializers for authentication workflows."""

from __future__ import annotations

from typing import Any, ClassVar

from django.utils.translation import gettext_lazy as _

from rest_framework import serializers

from .models import User


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
    user_type = serializers.ChoiceField(
        choices=User.UserType.choices,
        default=User.UserType.CUSTOMER,
    )

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

    def validate_user_type(self, value: str) -> str:
        if value == User.UserType.ORGANIZER:
            request = self.context.get("request")
            user = getattr(request, "user", None)
            is_authorized = bool(
                user
                and getattr(user, "is_authenticated", False)
                and getattr(user, "is_organizer", False)
            )
            if not is_authorized:
                raise serializers.ValidationError(
                    _("Only organizers can create organizer accounts."),
                )
        return value

    def create(self, validated_data: dict[str, Any]) -> User:
        password = validated_data.pop("password")
        validated_data.setdefault("user_type", User.UserType.CUSTOMER)
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
