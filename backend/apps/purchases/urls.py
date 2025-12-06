from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import PurchaseViewSet, VerificationViewSet

router = DefaultRouter()
router.register(r"", PurchaseViewSet, basename="purchase")
router.register(r"verifications", VerificationViewSet, basename="verifications")

urlpatterns = [
    path("", include(router.urls)),
]
