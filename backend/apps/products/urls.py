from django.urls import path
from .views import (
    CategoryListView, ProductListView, ProductDetailView,
    FeaturedProductsView, RelatedProductsView, SearchSuggestView,
    AdminCategoryListCreateView, AdminCategoryDetailView,
    AdminProductListCreateView, AdminProductDetailView,
    AdminProductImageView, AdminProductVariantListCreateView, bulk_csv_import,
)

urlpatterns = [
    # Public
    path("categories/", CategoryListView.as_view(), name="category_list"),
    path("", ProductListView.as_view(), name="product_list"),
    path("featured/", FeaturedProductsView.as_view(), name="featured_products"),
    path("search/suggest/", SearchSuggestView.as_view(), name="search_suggest"),
    path("<slug:slug>/", ProductDetailView.as_view(), name="product_detail"),
    path("<slug:slug>/related/", RelatedProductsView.as_view(), name="related_products"),

    # Admin
    path("admin/categories/", AdminCategoryListCreateView.as_view(), name="admin_category_list"),
    path("admin/categories/<int:pk>/", AdminCategoryDetailView.as_view(), name="admin_category_detail"),
    path("admin/products/", AdminProductListCreateView.as_view(), name="admin_product_list"),
    path("admin/products/csv-import/", bulk_csv_import, name="csv_import"),
    path("admin/products/<int:pk>/", AdminProductDetailView.as_view(), name="admin_product_detail"),
    path("admin/products/<int:pk>/images/", AdminProductImageView.as_view(), name="admin_product_images"),
    path("admin/products/<int:pk>/variants/", AdminProductVariantListCreateView.as_view(), name="admin_product_variants"),
]
