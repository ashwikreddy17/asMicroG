from django.urls import path
from .views import validate_coupon, AdminCouponListCreateView, AdminCouponDetailView

urlpatterns = [
    path("validate/", validate_coupon, name="validate_coupon"),
    path("admin/coupons/", AdminCouponListCreateView.as_view(), name="admin_coupon_list"),
    path("admin/coupons/<int:pk>/", AdminCouponDetailView.as_view(), name="admin_coupon_detail"),
]
