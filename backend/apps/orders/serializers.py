from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory, ReturnRequest
from apps.products.serializers import ProductListSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source="product", read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ("id", "product", "product_detail", "variant", "quantity", "price", "product_name", "product_sku", "subtotal")


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ("id", "status", "note", "created_at")


class ReturnRequestSerializer(serializers.ModelSerializer):
    order_number = serializers.SerializerMethodField()
    request_type_display = serializers.SerializerMethodField()
    reason_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = ReturnRequest
        fields = (
            "id", "order", "order_number", "request_type", "request_type_display",
            "reason", "reason_display", "description", "status", "status_display",
            "admin_note", "user_email", "created_at", "updated_at",
        )
        read_only_fields = ("id", "order", "order_number", "status", "status_display",
                            "request_type_display", "reason_display",
                            "admin_note", "user_email", "created_at", "updated_at")

    def get_order_number(self, obj):
        return obj.order.order_number

    def get_request_type_display(self, obj):
        return dict(ReturnRequest.TYPE_CHOICES).get(obj.request_type, obj.request_type)

    def get_reason_display(self, obj):
        return dict(ReturnRequest.REASON_CHOICES).get(obj.reason, obj.reason)

    def get_status_display(self, obj):
        return dict(ReturnRequest.STATUS_CHOICES).get(obj.status, obj.status)

    def get_user_email(self, obj):
        return obj.user.email


class ReturnRequestMinimalSerializer(serializers.ModelSerializer):
    request_type_display = serializers.SerializerMethodField()
    reason_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = ReturnRequest
        fields = ("id", "request_type", "request_type_display", "reason", "reason_display", "description", "status", "status_display", "admin_note", "created_at")

    def get_request_type_display(self, obj):
        return dict(ReturnRequest.TYPE_CHOICES).get(obj.request_type, obj.request_type)

    def get_reason_display(self, obj):
        return dict(ReturnRequest.REASON_CHOICES).get(obj.reason, obj.reason)

    def get_status_display(self, obj):
        return dict(ReturnRequest.STATUS_CHOICES).get(obj.status, obj.status)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    final_amount = serializers.ReadOnlyField()
    return_requests = ReturnRequestMinimalSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id", "order_number", "status", "total_amount", "discount_amount",
            "shipping_amount", "final_amount", "shipping_address", "payment_method",
            "payment_status", "payment_id", "tracking_number", "coupon", "notes",
            "estimated_delivery", "created_at", "updated_at", "items", "status_history",
            "return_requests",
        )
        read_only_fields = ("order_number", "payment_id", "created_at", "updated_at")


class CreateOrderSerializer(serializers.Serializer):
    shipping_address_id = serializers.IntegerField()
    payment_method = serializers.CharField(default="razorpay")
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class UpdateOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    note = serializers.CharField(required=False, allow_blank=True)
    tracking_number = serializers.CharField(required=False, allow_blank=True)
