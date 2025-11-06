
import importlib
import sys

_real = importlib.import_module("apps.raffles")
sys.modules["raffles"] = _real

if "apps.raffles.models" in sys.modules:
	sys.modules["raffles.models"] = sys.modules["apps.raffles.models"]


try:
	_views = importlib.import_module("apps.raffles.views")
	sys.modules["raffles.views"] = _views
except Exception:
	pass

from apps.raffles import * 
