
from django.contrib import admin

from .models import OnlinePayment, Payment, PaymentWithReceipt, Purchase, PurchaseDetail


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
	list_display = ("id", "raffle", "customer", "status", "total_amount", "reserved_at", "expires_at")
	list_filter = ("status", "reserved_at")
	search_fields = ("raffle__name", "customer__email")


@admin.register(PurchaseDetail)
class PurchaseDetailAdmin(admin.ModelAdmin):
	list_display = ("purchase", "number", "unit_price", "created_at")
	search_fields = ("purchase__raffle__name",)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
	list_display = ("id", "purchase", "amount", "payment_date", "created_by")
	list_filter = ("payment_date",)


@admin.register(OnlinePayment)
class OnlinePaymentAdmin(admin.ModelAdmin):
	list_display = ("payment", "gateway_name", "gateway_tx_id", "created_at")
	list_filter = ("gateway_name",)


@admin.register(PaymentWithReceipt)
class PaymentWithReceiptAdmin(admin.ModelAdmin):
	list_display = ("payment", "verification_status", "verification_date", "verified_by")
	list_filter = ("verification_status",)
