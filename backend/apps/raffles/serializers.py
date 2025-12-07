from typing import ClassVar

from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone

from rest_framework import serializers

from .models import Raffle


class RaffleBaseSerializer(serializers.ModelSerializer):
    state = serializers.SerializerMethodField()
    is_on_sale = serializers.SerializerMethodField()
    has_winner = serializers.SerializerMethodField()
    organizer_name = serializers.SerializerMethodField()

    class Meta:
        model = Raffle
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "description",
            "image",
            "number_start",
            "number_end",
            "price_per_number",
            "sale_start_at",
            "sale_end_at",
            "draw_scheduled_at",
            "winner_number",
            "organizer_name",
            "state",
            "is_on_sale",
            "has_winner",
        ]
        read_only_fields = fields

    def get_state(self, obj: Raffle) -> str:
        if obj.deleted_at:
            return "archived"
        if obj.winner_number is not None:
            return "completed"
        now = timezone.now()
        if now < obj.sale_start_at:
            return "upcoming"
        if obj.sale_start_at <= now <= obj.sale_end_at:
            return "selling"
        if now <= obj.draw_scheduled_at:
            return "closed"
        return "archived"

    def get_is_on_sale(self, obj: Raffle) -> bool:
        return obj.is_on_sale

    def get_has_winner(self, obj: Raffle) -> bool:
        return obj.has_winner

    def get_organizer_name(self, obj: Raffle) -> str | None:
        organizer = obj.organizer
        if not organizer:
            return None
        return (
            getattr(organizer, "name", None)
            or getattr(organizer, "get_full_name", lambda: None)()
            or getattr(organizer, "first_name", None)
            or getattr(organizer, "email", None)
        )


class PublicRaffleSerializer(RaffleBaseSerializer):
    pass


class OrganizerRaffleSerializer(RaffleBaseSerializer):
    class Meta(RaffleBaseSerializer.Meta):
        fields: ClassVar[list[str]] = [
            *RaffleBaseSerializer.Meta.fields,
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]


class OrganizerRaffleWriteSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)

    class Meta:
        model = Raffle
        fields: ClassVar[list[str]] = [
            "name",
            "description",
            "image",
            "number_start",
            "number_end",
            "price_per_number",
            "sale_start_at",
            "sale_end_at",
            "draw_scheduled_at",
        ]

    def validate(self, attrs: dict) -> dict:
        winner_raw = self.initial_data.get("winner_number")
        if winner_raw is not None:
            ns = attrs.get("number_start")
            ne = attrs.get("number_end")
            if ns is None or ne is None:
                raise serializers.ValidationError(
                    {
                        "winner_number": "Se debe proporcionar un rango de números para validar el número ganador."
                    }
                )
            try:
                winner_val = int(winner_raw)
            except (TypeError, ValueError) as exc:
                raise serializers.ValidationError(
                    {"winner_number": "Formato de número ganador inválido."}
                ) from exc
            if not (ns <= winner_val <= ne):
                raise serializers.ValidationError(
                    {
                        "winner_number": "El número ganador debe estar dentro del rango configurado."
                    }
                )
        return attrs

    def create(self, validated_data: dict[str, object]) -> Raffle:
        user = self.context["request"].user
        raffle = Raffle(
            organizer=user,
            created_by=user,
            updated_by=user,
            **validated_data,
        )
        try:
            raffle.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict) from exc
        raffle.save()
        return raffle


class RaffleAvailabilitySerializer(serializers.Serializer):
    raffle_id = serializers.IntegerField()
    taken_numbers = serializers.ListField(child=serializers.IntegerField())
