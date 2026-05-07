from django.urls import path
from .views import (
    OrderListView, OrderDetailView, create_order, cancel_order,
    user_return_requests,
    AdminOrderListView, AdminOrderDetailView, admin_update_order_status,
    admin_mark_cod_paid, AdminReturnListView, AdminReturnDetailView, admin_update_return,
    shipping_settings, admin_update_shipping,
)

urlpatterns = [
    path("", OrderListView.as_view(), name="order_list"),
    path("create/", create_order, name="create_order"),
    path("<int:pk>/", OrderDetailView.as_view(), name="order_detail"),
    path("<int:pk>/cancel/", cancel_order, name="cancel_order"),
    path("<int:pk>/returns/", user_return_requests, name="user_returns"),

    # Admin
    path("admin/orders/", AdminOrderListView.as_view(), name="admin_order_list"),
    path("admin/orders/<int:pk>/", AdminOrderDetailView.as_view(), name="admin_order_detail"),
    path("admin/orders/<int:pk>/status/", admin_update_order_status, name="admin_order_status"),
    path("admin/orders/<int:pk>/mark-paid/", admin_mark_cod_paid, name="admin_mark_paid"),
    path("admin/returns/", AdminReturnListView.as_view(), name="admin_return_list"),
    path("admin/returns/<int:pk>/", AdminReturnDetailView.as_view(), name="admin_return_detail"),
    path("admin/returns/<int:pk>/update/", admin_update_return, name="admin_return_update"),

    # Shipping settings
    path("shipping-settings/", shipping_settings, name="shipping_settings"),
    path("admin/shipping-settings/", admin_update_shipping, name="admin_shipping_settings"),
]
