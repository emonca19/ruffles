from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.core.exceptions import ValidationError

import pytest

from apps.authentication.models import User
from apps.raffles.models import Raffle


@pytest.mark.django_db
def test_create_raffle_today_hermosillo_time():
    """
    Test that a raffle can be created with a start time that is 'today' in Hermosillo,
    even if it is technically 'past' in UTC or relative to absolute 'now'.
    """
    organizer = User.objects.create_user(email="org@example.com", password="password")

    hermosillo_tz = ZoneInfo("America/Hermosillo")
    now_hermosillo = datetime.now(hermosillo_tz)

    # Create a time that is 1 hour ago in Hermosillo
    # This should be allowed if it's still the "same day" in Hermosillo
    past_time_hermosillo = now_hermosillo - timedelta(hours=1)

    # Ensure it is still the same day for the test validity
    if past_time_hermosillo.date() < now_hermosillo.date():
        # Edge case: midnight transition, just force it to be "start of today" in Hermosillo
        past_time_hermosillo = now_hermosillo.replace(
            hour=0, minute=1, second=0, microsecond=0
        )

    sale_end = now_hermosillo + timedelta(days=1)
    draw_date = now_hermosillo + timedelta(days=2)

    raffle = Raffle(
        name="Hermosillo Raffle",
        organizer=organizer,
        number_start=1,
        number_end=100,
        price_per_number=10.0,
        sale_start_at=past_time_hermosillo,  # The crucial field
        sale_end_at=sale_end,
        draw_scheduled_at=draw_date,
    )

    # This should pass validation
    try:
        raffle.clean()
    except ValidationError as e:
        pytest.fail(f"Raffle validation failed for same-day Hermosillo time: {e}")


@pytest.mark.django_db
def test_create_raffle_yesterday_hermosillo_time_fails():
    """
    Test that a raffle CANNOT be created if the start time is strictly 'yesterday'
    in Hermosillo time.
    """
    organizer = User.objects.create_user(email="org2@example.com", password="password")

    hermosillo_tz = ZoneInfo("America/Hermosillo")
    now_hermosillo = datetime.now(hermosillo_tz)

    # Create a time that is definitely yesterday
    yesterday_hermosillo = now_hermosillo - timedelta(days=1)

    sale_end = now_hermosillo + timedelta(days=1)
    draw_date = now_hermosillo + timedelta(days=2)

    raffle = Raffle(
        name="Past Raffle",
        organizer=organizer,
        number_start=1,
        number_end=100,
        price_per_number=10.0,
        sale_start_at=yesterday_hermosillo,
        sale_end_at=sale_end,
        draw_scheduled_at=draw_date,
    )

    # This should FAIL validation
    with pytest.raises(ValidationError) as excinfo:
        raffle.clean()

    assert "sale_start_at" in excinfo.value.message_dict
