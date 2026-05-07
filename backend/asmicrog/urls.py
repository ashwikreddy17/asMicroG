from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path("admin/", admin.site.urls),

    # API v1
    path("api/auth/", include("apps.users.urls")),
    path("api/products/", include("apps.products.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/cart/", include("apps.cart.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/coupons/", include("apps.coupons.urls")),
    path("api/reviews/", include("apps.reviews.urls")),
    path("api/support/", include("apps.support.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/wishlist/", include("apps.wishlist.urls")),
    path("api/banners/", include("apps.banners.urls")),

    # API schema & docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
