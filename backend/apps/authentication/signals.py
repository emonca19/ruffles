"""Signal handlers for authentication app."""

from __future__ import annotations

import logging
from typing import cast

from django.apps import AppConfig
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .models import User

logger = logging.getLogger(__name__)


@receiver(post_migrate)
def ensure_default_organizer(sender: type[AppConfig], **kwargs: object) -> None:
    """Create a default organizer account after migrations (idempotent)."""

    if sender.label != "authentication":  # Only run after this app's migrations
        return

    email = getattr(settings, "DEFAULT_ORGANIZER_EMAIL", "").strip()
    password = getattr(settings, "DEFAULT_ORGANIZER_PASSWORD", "").strip()
    name = getattr(settings, "DEFAULT_ORGANIZER_NAME", "Lead Organizer").strip() or "Lead Organizer"

    if not email or not password:
        logger.debug("Skipping default organizer creation; credentials not configured.")
        return

    user_model = cast(type[User], get_user_model())

    if user_model.objects.filter(email__iexact=email).exists():
        logger.debug("Default organizer %s already exists.", email)
        return

    manager = user_model.objects
    user = manager.create_user(
        email=email,
        password=password,
        name=name,
        user_type=user_model.UserType.ORGANIZER,
        is_staff=True,
    )
    logger.info("Created default organizer account: %s", user.email)
