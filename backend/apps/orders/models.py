import uuid
from django.db import models
from django.conf import settings
from apps.products.models import Product, ProductVariant
from apps.coupons.models import Coupon


def generate_order_number():
    return f"ORD-{uuid.uuid4().hex[:10].upper()}"


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]
    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    order_number = models.CharField(max_length=30, unique=True, default=generate_order_number)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_address = models.JSONField()
    payment_method = models.CharField(max_length=50, default="razorpay")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending")
    payment_id = models.CharField(max_length=200, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"], name="idx_order_user_status"),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["order_number"]),
        ]

    def __str__(self):
        return self.order_number

    @property
    def final_amount(self):
        return self.total_amount - self.discount_amount + self.shipping_amount


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    product_name = models.CharField(max_length=200)
    product_sku = models.CharField(max_length=100)

    class Meta:
        db_table = "order_items"

    @property
    def subtotal(self):
        return self.price * self.quantity


class ReturnRequest(models.Model):
    TYPE_CHOICES = [("return", "Return"), ("refund", "Refund")]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
    ]
    REASON_CHOICES = [
        ("damaged", "Damaged / Defective"),
        ("wrong_item", "Wrong Item Received"),
        ("not_as_described", "Not as Described"),
        ("change_of_mind", "Change of Mind"),
        ("other", "Other"),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="return_requests")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="return_requests")
    request_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "return_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.request_type} for {self.order.order_number}"


class ShippingSettings(models.Model):
    free_shipping_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=500)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=50)
    first_order_free = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "shipping_settings"

    @classmethod
    def get(cls):
        try:
            obj, _ = cls.objects.get_or_create(pk=1)
            return obj
        except Exception:
            return cls(free_shipping_threshold=500, shipping_cost=50, first_order_free=False)


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    status = models.CharField(max_length=20)
    note = models.TextField(blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "order_status_history"
        ordering = ["-created_at"]
