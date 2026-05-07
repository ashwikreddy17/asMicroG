from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import WishlistItem
from .serializers import WishlistItemSerializer
from apps.products.models import Product


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_wishlist(request):
    items = WishlistItem.objects.filter(user=request.user).select_related("product")
    return Response(WishlistItemSerializer(items, many=True).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def toggle_wishlist(request):
    product_id = request.data.get("product_id")
    try:
        product = Product.objects.get(pk=product_id, is_active=True)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
    if not created:
        item.delete()
        return Response({"action": "removed", "product_id": product_id})

    return Response({"action": "added", "item": WishlistItemSerializer(item).data}, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def remove_wishlist_item(request, pk):
    try:
        item = WishlistItem.objects.get(pk=pk, user=request.user)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except WishlistItem.DoesNotExist:
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
