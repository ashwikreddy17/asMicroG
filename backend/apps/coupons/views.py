from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Coupon
from .serializers import CouponSerializer, ValidateCouponSerializer


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def validate_coupon(request):
    serializer = ValidateCouponSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        coupon = Coupon.objects.get(code=data["code"].upper())
    except Coupon.DoesNotExist:
        return Response({"error": "Invalid coupon code."}, status=status.HTTP_404_NOT_FOUND)

    valid, message = coupon.is_valid()
    if not valid:
        return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

    if data["order_amount"] < coupon.min_order_amount:
        return Response(
            {"error": f"Minimum order amount is ₹{coupon.min_order_amount}."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    discount = coupon.calculate_discount(data["order_amount"])
    return Response({"discount": discount, "code": coupon.code, "type": coupon.discount_type, "value": coupon.value})


# Admin
class AdminCouponListCreateView(generics.ListCreateAPIView):
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Coupon.objects.all().order_by("-created_at")


class AdminCouponDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Coupon.objects.all()
