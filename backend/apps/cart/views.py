from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Cart, CartItem
from .serializers import CartSerializer, AddToCartSerializer
from apps.products.models import Product, ProductVariant


def get_or_create_cart(request):
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart
    session_key = request.session.session_key
    if not session_key:
        request.session.create()
        session_key = request.session.session_key
    cart, _ = Cart.objects.get_or_create(session_key=session_key)
    return cart


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def get_cart(request):
    cart = get_or_create_cart(request)
    return Response(CartSerializer(cart).data)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def add_to_cart(request):
    serializer = AddToCartSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    product = get_object_or_404(Product, pk=data["product_id"], is_active=True)
    variant = None
    if data.get("variant_id"):
        variant = get_object_or_404(ProductVariant, pk=data["variant_id"], product=product)

    available_stock = variant.stock if variant else product.stock
    if available_stock < data["quantity"]:
        return Response({"error": "Insufficient stock."}, status=status.HTTP_400_BAD_REQUEST)

    cart = get_or_create_cart(request)
    cart_item, created = CartItem.objects.get_or_create(
        cart=cart, product=product, variant=variant,
        defaults={"quantity": data["quantity"]},
    )
    if not created:
        new_qty = cart_item.quantity + data["quantity"]
        if available_stock < new_qty:
            return Response({"error": "Insufficient stock."}, status=status.HTTP_400_BAD_REQUEST)
        cart_item.quantity = new_qty
        cart_item.save()

    return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


@api_view(["PATCH"])
@permission_classes([permissions.AllowAny])
def update_cart_item(request, item_id):
    cart = get_or_create_cart(request)
    item = get_object_or_404(CartItem, pk=item_id, cart=cart)
    quantity = request.data.get("quantity", 1)
    if quantity < 1:
        item.delete()
    else:
        item.quantity = quantity
        item.save()
    return Response(CartSerializer(cart).data)


@api_view(["DELETE"])
@permission_classes([permissions.AllowAny])
def remove_cart_item(request, item_id):
    cart = get_or_create_cart(request)
    item = get_object_or_404(CartItem, pk=item_id, cart=cart)
    item.delete()
    return Response(CartSerializer(cart).data)


@api_view(["DELETE"])
@permission_classes([permissions.AllowAny])
def clear_cart(request):
    cart = get_or_create_cart(request)
    cart.items.all().delete()
    return Response(CartSerializer(cart).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def merge_guest_cart(request):
    """Merge session cart into user cart after login."""
    session_key = request.data.get("session_key")
    if not session_key:
        return Response({"detail": "No session key."})

    try:
        guest_cart = Cart.objects.get(session_key=session_key)
    except Cart.DoesNotExist:
        return Response({"detail": "Guest cart not found."})

    user_cart, _ = Cart.objects.get_or_create(user=request.user)
    for item in guest_cart.items.all():
        existing = CartItem.objects.filter(cart=user_cart, product=item.product, variant=item.variant).first()
        if existing:
            existing.quantity += item.quantity
            existing.save()
        else:
            item.cart = user_cart
            item.save()
    guest_cart.delete()
    return Response(CartSerializer(user_cart).data)
