from django.urls import path
from .views import ProductReviewListView, CreateReviewView, ReviewDetailView, mark_helpful

urlpatterns = [
    path("products/<slug:slug>/", ProductReviewListView.as_view(), name="product_reviews"),
    path("", CreateReviewView.as_view(), name="create_review"),
    path("<int:pk>/", ReviewDetailView.as_view(), name="review_detail"),
    path("<int:pk>/helpful/", mark_helpful, name="mark_helpful"),
]
