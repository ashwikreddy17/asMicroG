from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import Order, OrderItem, OrderStatusHistory, ReturnRequest, ShippingSettings
from .serializers import (
    OrderSerializer, CreateOrderSerializer, UpdateOrderStatusSerializer,
    ReturnRequestSerializer,
)
from apps.cart.models import Cart, CartItem
from apps.users.models import Address
from apps.coupons.models import Coupon
from apps.notifications.tasks import send_order_confirmation_email
from apps.core.pagination import StandardPagePagination


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagePagination

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__product", "status_history", "return_requests")
            .order_by("-created_at")
        )


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            "items__product", "status_history", "return_requests"
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_order(request):
    serializer = CreateOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    address = get_object_or_404(Address, pk=data["shipping_address_id"], user=request.user)
    cart = get_object_or_404(Cart, user=request.user)
    cart_items = CartItem.objects.filter(cart=cart).select_related("product", "variant")

    if not cart_items.exists():
        return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

    for item in cart_items:
        product = item.product
        available = item.variant.stock if item.variant else product.stock
        if item.quantity > available:
            return Response(
                {"error": f"Insufficient stock for {product.name}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    with transaction.atomic():
        subtotal = sum(item.subtotal for item in cart_items)
        discount = 0
        coupon_obj = None

        coupon_code = data.get("coupon_code", "").strip()
        if coupon_code:
            try:
                coupon_obj = Coupon.objects.get(code=coupon_code.upper())
                valid, msg = coupon_obj.is_valid()
                if not valid:
                    return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)
                if subtotal < coupon_obj.min_order_amount:
                    return Response(
                        {"error": f"Minimum order amount is ₹{coupon_obj.min_order_amount}."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                discount = coupon_obj.calculate_discount(subtotal)
                coupon_obj.uses_count += 1
                coupon_obj.save()
            except Coupon.DoesNotExist:
                return Response({"error": "Invalid coupon code."}, status=status.HTTP_400_BAD_REQUEST)

        ss = ShippingSettings.get()
        is_first_order = ss.first_order_free and not Order.objects.filter(user=request.user).exists()
        shipping = 0 if (subtotal >= ss.free_shipping_threshold or is_first_order) else ss.shipping_cost
        order = Order.objects.create(
            user=request.user,
            total_amount=subtotal,
            discount_amount=discount,
            shipping_amount=shipping,
            shipping_address={
                "full_name": address.full_name,
                "phone": address.phone,
                "address_line1": address.address_line1,
                "address_line2": address.address_line2,
                "city": address.city,
                "state": address.state,
                "postal_code": address.postal_code,
                "country": address.country,
            },
            payment_method=data["payment_method"],
            coupon=coupon_obj,
            notes=data.get("notes", ""),
        )

        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                variant=item.variant,
                quantity=item.quantity,
                price=item.unit_price,
                product_name=item.product.name,
                product_sku=item.variant.sku if item.variant else item.product.sku,
            )
            if item.variant:
                item.variant.stock -= item.quantity
                item.variant.save()
            else:
                item.product.stock -= item.quantity
                item.product.save()

        OrderStatusHistory.objects.create(order=order, status="pending", note="Order placed.")
        cart_items.delete()

    try:
        send_order_confirmation_email.delay(order.id)
    except Exception:
        pass
    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cancel_order(request, pk):
    order = get_object_or_404(Order, pk=pk, user=request.user)
    if order.status not in ("pending", "processing"):
        return Response({"error": "Order cannot be cancelled."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        order.status = "cancelled"
        order.save()
        for item in order.items.all():
            if item.variant:
                item.variant.stock += item.quantity
                item.variant.save()
            else:
                item.product.stock += item.quantity
                item.product.save()
        OrderStatusHistory.objects.create(order=order, status="cancelled", note="Cancelled by user.")

    return Response(OrderSerializer(order).data)


# ── Return / Refund Requests ──────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def user_return_requests(request, pk):
    order = get_object_or_404(Order, pk=pk, user=request.user)

    if request.method == "GET":
        returns = ReturnRequest.objects.filter(order=order, user=request.user)
        return Response(ReturnRequestSerializer(returns, many=True).data)

    if order.status != "delivered":
        return Response({"error": "Only delivered orders can be returned or refunded."}, status=status.HTTP_400_BAD_REQUEST)

    if ReturnRequest.objects.filter(order=order, user=request.user).exists():
        return Response({"error": "A return/refund request already exists for this order."}, status=status.HTTP_400_BAD_REQUEST)

    serializer = ReturnRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    rr = serializer.save(order=order, user=request.user)
    return Response(ReturnRequestSerializer(rr).data, status=status.HTTP_201_CREATED)


# ── Admin ─────────────────────────────────────────────────────────

class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = StandardPagePagination
    filterset_fields = ["status", "payment_status", "payment_method"]
    search_fields = ["order_number", "user__email"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Order.objects.all().select_related("user").prefetch_related("items__product", "return_requests")


class AdminOrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Order.objects.all().prefetch_related("items__product", "status_history", "return_requests")


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_update_order_status(request, pk):
    order = get_object_or_404(Order, pk=pk)
    serializer = UpdateOrderStatusSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    order.status = data["status"]
    if data.get("tracking_number"):
        order.tracking_number = data["tracking_number"]
    order.save()

    OrderStatusHistory.objects.create(
        order=order,
        status=data["status"],
        note=data.get("note", ""),
        updated_by=request.user,
    )
    return Response(OrderSerializer(order).data)


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def admin_mark_cod_paid(request, pk):
    order = get_object_or_404(Order, pk=pk)
    if order.payment_method != "cod":
        return Response({"error": "Not a COD order."}, status=status.HTTP_400_BAD_REQUEST)
    if order.payment_status == "paid":
        return Response({"error": "Already marked as paid."}, status=status.HTTP_400_BAD_REQUEST)
    order.payment_status = "paid"
    order.save(update_fields=["payment_status", "updated_at"])
    OrderStatusHistory.objects.create(order=order, status=order.status, note="COD payment collected.", updated_by=request.user)
    return Response({"payment_status": "paid", "message": "Marked as paid."})


class AdminReturnListView(generics.ListAPIView):
    serializer_class = ReturnRequestSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = StandardPagePagination
    filterset_fields = ["status", "request_type"]

    def get_queryset(self):
        return ReturnRequest.objects.all().select_related("order", "user")


class AdminReturnDetailView(generics.RetrieveAPIView):
    serializer_class = ReturnRequestSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return ReturnRequest.objects.all().select_related("order", "user")


@api_view(["PATCH"])
@permission_classes([permissions.IsAdminUser])
def admin_update_return(request, pk):
    rr = get_object_or_404(ReturnRequest, pk=pk)
    new_status = request.data.get("status")
    admin_note = request.data.get("admin_note")

    update_fields = ["updated_at"]
    if new_status and new_status in dict(ReturnRequest.STATUS_CHOICES):
        rr.status = new_status
        update_fields.append("status")
    if admin_note is not None:
        rr.admin_note = admin_note
        update_fields.append("admin_note")

    rr.save(update_fields=update_fields)

    if rr.status == "completed" and rr.request_type == "refund":
        rr.order.payment_status = "refunded"
        rr.order.status = "refunded"
        rr.order.save(update_fields=["payment_status", "status", "updated_at"])
        OrderStatusHistory.objects.create(order=rr.order, status="refunded", note="Refund completed by admin.", updated_by=request.user)

    rr.refresh_from_db()
    return Response(ReturnRequestSerializer(rr).data)


# ── Shipping Settings ─────────────────────────────────────────────

@api_view(["GET"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def shipping_settings(request):
    s = ShippingSettings.get()
    return Response({
        "free_shipping_threshold": float(s.free_shipping_threshold),
        "shipping_cost": float(s.shipping_cost),
        "first_order_free": s.first_order_free,
    })


@api_view(["PATCH"])
@permission_classes([permissions.IsAdminUser])
def admin_update_shipping(request):
    s = ShippingSettings.get()
    threshold = request.data.get("free_shipping_threshold")
    cost = request.data.get("shipping_cost")
    first_free = request.data.get("first_order_free")

    update_fields = []
    if threshold is not None:
        s.free_shipping_threshold = threshold
        update_fields.append("free_shipping_threshold")
    if cost is not None:
        s.shipping_cost = cost
        update_fields.append("shipping_cost")
    if first_free is not None:
        s.first_order_free = bool(first_free)
        update_fields.append("first_order_free")

    if update_fields:
        s.save(update_fields=update_fields + ["updated_at"])
    return Response({
        "free_shipping_threshold": float(s.free_shipping_threshold),
        "shipping_cost": float(s.shipping_cost),
        "first_order_free": s.first_order_free,
    })
