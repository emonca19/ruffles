import os
import sys
from datetime import timedelta
from decimal import Decimal

import django
from django.utils import timezone

# Add the project root to sys.path so we can import config
sys.path.append("/app")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
django.setup()

from django.contrib.auth import get_user_model

from rest_framework_simplejwt.tokens import RefreshToken

from apps.purchases.models import Purchase, PurchaseDetail
from apps.raffles.models import Raffle

User = get_user_model()

# 1. Create Users
organizer, _ = User.objects.get_or_create(
    email="org_curl@example.com",
    defaults={"name": "Org Curl", "user_type": "organizer"},
)
organizer.set_password("pass")
organizer.save()

client, _ = User.objects.get_or_create(
    email="client_curl@example.com",
    defaults={"name": "Client Curl", "user_type": "customer", "phone": "9998887777"},
)
client.set_password("pass")
client.phone = "9998887777"
client.save()

# 2. Create Raffle
raffle, _ = Raffle.objects.get_or_create(
    name="Curl Test Raffle",
    organizer=organizer,
    defaults={
        "number_start": 1,
        "number_end": 100,
        "price_per_number": Decimal("10.00"),
        "sale_start_at": timezone.now(),
        "sale_end_at": timezone.now() + timedelta(days=7),
        "draw_scheduled_at": timezone.now() + timedelta(days=8),
    },
)

# 3. Create Purchases
# Guest Purchase (Paid) - Number 5
p1, _ = Purchase.objects.get_or_create(
    raffle=raffle,
    guest_name="Guest Curl",
    guest_phone="5550001111",
    defaults={"status": Purchase.Status.PAID, "total_amount": 10},
)
PurchaseDetail.objects.get_or_create(purchase=p1, number=5, defaults={"unit_price": 10})

# Client Purchase (Pending) - Number 10
p2, _ = Purchase.objects.get_or_create(
    raffle=raffle,
    customer=client,
    defaults={"status": Purchase.Status.PENDING, "total_amount": 10},
)
PurchaseDetail.objects.get_or_create(
    purchase=p2, number=10, defaults={"unit_price": 10}
)

# 4. Generate Tokens
org_token = str(RefreshToken.for_user(organizer).access_token)
client_token = str(RefreshToken.for_user(client).access_token)

print(f"RAFFLE_ID={raffle.id}")  # type: ignore
print(f"ORG_TOKEN={org_token}")
print(f"CLIENT_TOKEN={client_token}")
