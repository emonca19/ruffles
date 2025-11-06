"""Top-level users package shim.

This package provides a `users.models` module so tests that import
`from users.models import User` work without changing test code.
"""

from . import models  # re-export models module
