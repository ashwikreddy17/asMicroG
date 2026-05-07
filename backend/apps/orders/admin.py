from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product_name", "product_sku", "price", "quantity")


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ("status", "note", "updated_by", "created_at")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "status", "payment_status", "final_amount", "created_at")
    list_filter = ("status", "payment_status", "payment_method")
    search_fields = ("order_number", "user__email")
    readonly_fields = ("order_number", "created_at", "updated_at")
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    ordering = ("-created_at",)
