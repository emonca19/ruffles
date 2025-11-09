"""
Development settings for Ruffles project.
"""

from .base import *

# ============================================
# Development Configuration
# ============================================
DEBUG = True
ENVIRONMENT = "local"

# Allow all hosts in development
ALLOWED_HOSTS = ["*"]

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG",
    },
}

# Email backend (console output for development)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# DRF settings for development
REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"] = [
    "rest_framework.permissions.AllowAny",
]
