from django.db import models
from django.conf import settings


class Payment(models.Model):
    GATEWAY_CHOICES = [("razorpay", "Razorpay"), ("stripe", "Stripe")]
    STATUS_CHOICES = [("created", "Created"), ("paid", "Paid"), ("failed", "Failed"), ("refunded", "Refunded")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments")
    order = models.OneToOneField("orders.Order", on_delete=models.CASCADE, related_name="payment")
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES)
    gateway_order_id = models.CharField(max_length=200, blank=True)
    gateway_payment_id = models.CharField(max_length=200, blank=True)
    gateway_signature = models.CharField(max_length=500, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="INR")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="created")
    raw_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments"

    def __str__(self):
        return f"{self.gateway} | {self.order.order_number} | {self.status}"
