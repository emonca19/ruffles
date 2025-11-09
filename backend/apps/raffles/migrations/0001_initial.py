import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Raffle",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, default="")),
                ("image_url", models.URLField(blank=True)),
                ("number_start", models.PositiveIntegerField()),
                ("number_end", models.PositiveIntegerField()),
                (
                    "price_per_number",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=10,
                        validators=[django.core.validators.MinValueValidator(0)],
                    ),
                ),
                ("sale_start_at", models.DateTimeField()),
                ("sale_end_at", models.DateTimeField()),
                ("draw_scheduled_at", models.DateTimeField()),
                ("winner_number", models.PositiveIntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="raffles_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organizer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="organized_raffles",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="raffles_updated",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
                "constraints": (
                    models.CheckConstraint(
                        condition=models.Q(number_start__lt=models.F("number_end")),
                        name="raffle_number_range_valid",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(sale_start_at__lt=models.F("sale_end_at")),
                        name="raffle_sale_window_valid",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(sale_end_at__lt=models.F("draw_scheduled_at")),
                        name="raffle_draw_after_sale",
                    ),
                ),
            },
        )
    ]
