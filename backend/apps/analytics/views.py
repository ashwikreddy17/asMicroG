from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from datetime import timedelta


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def dashboard_stats(request):
    cache_key = "analytics_dashboard"
    data = cache.get(cache_key)
    if data:
        return Response(data)

    from apps.orders.models import Order
    from apps.users.models import User
    from apps.products.models import Product

    now = timezone.now()
    today = now.date()
    month_start = today.replace(day=1)

    total_revenue = Order.objects.filter(payment_status="paid").aggregate(
        total=Sum("total_amount")
    )["total"] or 0

    monthly_revenue = Order.objects.filter(
        payment_status="paid", created_at__date__gte=month_start
    ).aggregate(total=Sum("total_amount"))["total"] or 0

    orders_today = Order.objects.filter(created_at__date=today).count()
    orders_this_month = Order.objects.filter(created_at__date__gte=month_start).count()
    total_customers = User.objects.filter(is_staff=False, is_banned=False).count()
    new_customers_month = User.objects.filter(date_joined__date__gte=month_start).count()
    low_stock_count = Product.objects.filter(is_active=True, stock__lte=settings.LOW_STOCK_THRESHOLD).count()

    order_status_breakdown = list(
        Order.objects.values("status").annotate(count=Count("id")).order_by("status")
    )

    data = {
        "total_revenue": float(total_revenue),
        "monthly_revenue": float(monthly_revenue),
        "orders_today": orders_today,
        "orders_this_month": orders_this_month,
        "total_customers": total_customers,
        "new_customers_month": new_customers_month,
        "low_stock_count": low_stock_count,
        "order_status_breakdown": order_status_breakdown,
    }
    cache.set(cache_key, data, settings.CACHE_TTL_ANALYTICS)
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def sales_chart(request):
    from apps.orders.models import Order
    days = int(request.query_params.get("days", 30))
    since = timezone.now() - timedelta(days=days)

    daily = (
        Order.objects.filter(payment_status="paid", created_at__gte=since)
        .annotate(day=TruncDay("created_at"))
        .values("day")
        .annotate(revenue=Sum("total_amount"), orders=Count("id"))
        .order_by("day")
    )
    return Response([
        {
            "date": d["day"].strftime("%d %b"),
            "revenue": float(d["revenue"] or 0),
            "orders": d["orders"],
        }
        for d in daily
    ])


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def monthly_revenue(request):
    from apps.orders.models import Order
    monthly = (
        Order.objects.filter(payment_status="paid")
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(revenue=Sum("total_amount"), orders=Count("id"))
        .order_by("month")
    )
    return Response([
        {
            "month": d["month"].strftime("%b %Y"),
            "revenue": float(d["revenue"] or 0),
            "orders": d["orders"],
        }
        for d in monthly
    ])


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def top_products(request):
    from apps.orders.models import OrderItem
    limit = int(request.query_params.get("limit", 10))
    products = (
        OrderItem.objects.values(
            "product__id", "product__name", "product__category__name",
        )
        .annotate(units_sold=Sum("quantity"), revenue=Sum(F("quantity") * F("price")))
        .order_by("-units_sold")[:limit]
    )
    return Response([
        {
            "id": p["product__id"],
            "name": p["product__name"],
            "category": p["product__category__name"] or "Uncategorized",
            "units_sold": p["units_sold"],
            "revenue": float(p["revenue"] or 0),
        }
        for p in products
    ])


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def category_breakdown(request):
    from apps.orders.models import OrderItem
    data = (
        OrderItem.objects.values("product__category__name")
        .annotate(revenue=Sum(F("quantity") * F("price")), orders=Count("id"))
        .order_by("-revenue")
    )
    return Response([
        {
            "category": d["product__category__name"] or "Uncategorized",
            "revenue": float(d["revenue"] or 0),
            "orders": d["orders"],
        }
        for d in data
    ])


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def low_stock_products(request):
    from apps.products.models import Product
    products = Product.objects.filter(
        is_active=True, stock__lte=settings.LOW_STOCK_THRESHOLD
    ).values("id", "name", "sku", "stock").order_by("stock")
    return Response(list(products))
