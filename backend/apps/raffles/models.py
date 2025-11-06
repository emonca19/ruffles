from django.db import models
from django.conf import settings


class Raffle(models.Model):
	name = models.CharField(max_length=255)
	status = models.CharField(max_length=32, default="draft")
	price_per_number = models.CharField(max_length=64, null=True, blank=True)
	image_url = models.URLField(null=True, blank=True)
	created_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		null=True,
		blank=True,
		on_delete=models.SET_NULL,
		related_name="raffles",
	)

	def __str__(self) -> str:
		return self.name

	class Meta:
		app_label = "raffles"
