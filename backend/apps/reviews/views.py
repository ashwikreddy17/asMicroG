from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer
from apps.core.pagination import SmallCursorPagination


class ProductReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = SmallCursorPagination

    def get_queryset(self):
        return Review.objects.filter(
            product__slug=self.kwargs["slug"], is_approved=True
        ).select_related("user")


class CreateReviewView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        from apps.orders.models import OrderItem
        product = serializer.validated_data["product"]
        is_verified = OrderItem.objects.filter(
            order__user=self.request.user,
            product=product,
            order__payment_status="paid",
        ).exists()
        serializer.save(user=self.request.user, is_verified_purchase=is_verified)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def mark_helpful(request, pk):
    try:
        review = Review.objects.get(pk=pk)
        review.helpful_count += 1
        review.save()
        return Response({"helpful_count": review.helpful_count})
    except Review.DoesNotExist:
        return Response({"error": "Review not found."}, status=status.HTTP_404_NOT_FOUND)
