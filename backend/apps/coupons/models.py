from django.db import models
from django.utils import timezone


class Coupon(models.Model):
    DISCOUNT_TYPES = [
        ("flat", "Flat Amount"),
        ("percentage", "Percentage"),
    ]

    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.CharField(max_length=200, blank=True)
    discount_type = models.CharField(max_length=15, choices=DISCOUNT_TYPES, default="percentage")
    value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    uses_count = models.PositiveIntegerField(default=0)
    per_user_limit = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "coupons"

    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False, "Coupon is not active."
        if self.valid_until and now > self.valid_until:
            return False, "Coupon has expired."
        if now < self.valid_from:
            return False, "Coupon is not yet valid."
        if self.max_uses and self.uses_count >= self.max_uses:
            return False, "Coupon usage limit reached."
        return True, "Valid"

    def calculate_discount(self, order_amount):
        if self.discount_type == "flat":
            discount = self.value
        else:
            discount = (order_amount * self.value) / 100
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
        return min(discount, order_amount)

    def __str__(self):
        return self.code
