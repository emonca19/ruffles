"""
Settings package for Ruffles project.
Imports from environment-specific modules.
"""

import os

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    from .production import *
else:
    from .local import *
