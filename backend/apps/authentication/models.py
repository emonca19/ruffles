"""Authentication domain models."""

from __future__ import annotations

from typing import ClassVar

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models


class UserManager(BaseUserManager["User"]):
    def _create_user(
        self, email: str, password: str | None, **extra_fields: object
    ) -> User:
        if not email:
            raise ValueError("The email address must be set")
        normalized_email = self.normalize_email(email)
        user = self.model(email=normalized_email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(
        self, email: str, password: str | None = None, **extra_fields: object
    ) -> User:
        options: dict[str, object] = {
            "is_staff": False,
            "is_superuser": False,
            "is_active": True,
        }
        options.update(extra_fields)
        return self._create_user(email, password, **options)

    def create_superuser(
        self, email: str, password: str, **extra_fields: object
    ) -> User:
        options: dict[str, object] = {
            "is_staff": True,
            "is_superuser": True,
            "is_active": True,
        }
        options.update(extra_fields)

        if options.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if options.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **options)


class User(AbstractBaseUser, PermissionsMixin):
    class UserType(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        ORGANIZER = "organizer", "Organizer"

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(r"^[0-9+().\-\s]*$", "Enter a valid phone number.")],
    )
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.CUSTOMER,
    )

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects: UserManager = UserManager()

    EMAIL_FIELD = "email"
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    class Meta:
        ordering = ("-date_joined",)
        indexes = (models.Index(fields=("email",), name="user_email_idx"),)

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.email

    @property
    def is_organizer(self) -> bool:
        return self.user_type == self.UserType.ORGANIZER

    @property
    def is_customer(self) -> bool:
        return self.user_type == self.UserType.CUSTOMER
