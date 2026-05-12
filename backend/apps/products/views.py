from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.cache import cache
from django.conf import settings
from django.db.models import Q
import csv
import io

from .models import Category, Product, ProductVariant, ProductImage
from .serializers import (
    CategorySerializer, ProductListSerializer,
    ProductDetailSerializer, ProductWriteSerializer,
    ProductVariantSerializer, ProductImageSerializer,
)
from .filters import ProductFilter
from apps.core.pagination import StandardPagePagination


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(is_active=True, parent=None)

    def list(self, request, *args, **kwargs):
        cache_key = "categories_tree"
        data = cache.get(cache_key)
        if data is None:
            response = super().list(request, *args, **kwargs)
            cache.set(cache_key, response.data, settings.CACHE_TTL_CATEGORY)
            return response
        return Response(data)


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_class = ProductFilter
    pagination_class = StandardPagePagination
    search_fields = ["name", "description", "brand", "tags", "sku"]
    ordering_fields = ["price", "created_at", "name", "stock"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("images")
        )


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related("category").prefetch_related(
            "images", "variants"
        )

    def retrieve(self, request, *args, **kwargs):
        slug = kwargs.get("slug")
        cache_key = f"product_detail_{slug}"
        data = cache.get(cache_key)
        if data is None:
            response = super().retrieve(request, *args, **kwargs)
            cache.set(cache_key, response.data, settings.CACHE_TTL_PRODUCT)
            return response
        return Response(data)


class FeaturedProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True, is_featured=True)
            .select_related("category")
            .prefetch_related("images", "reviews")
            .order_by("-created_at")[:12]
        )


class RelatedProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        slug = self.kwargs["slug"]
        try:
            product = Product.objects.get(slug=slug)
        except Product.DoesNotExist:
            return Product.objects.none()
        return (
            Product.objects.filter(category=product.category, is_active=True)
            .exclude(slug=slug)
            .select_related("category")
            .prefetch_related("images")[:8]
        )


class SearchSuggestView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        q = self.request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Product.objects.none()
        return (
            Product.objects.filter(
                Q(name__icontains=q) | Q(brand__icontains=q) | Q(tags__icontains=q),
                is_active=True,
            )
            .select_related("category")
            .prefetch_related("images")[:8]
        )


# ── Admin category CRUD ───────────────────────────────────────
class AdminCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Category.objects.all()

    def perform_create(self, serializer):
        serializer.save()
        cache.delete("categories_tree")


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Category.objects.all()

    def perform_update(self, serializer):
        serializer.save()
        cache.delete("categories_tree")

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete("categories_tree")


# ── Admin product CRUD ────────────────────────────────────────
def _save_uploaded_images(product, files):
    """Save files from request.FILES['uploaded_images'] as ProductImage objects."""
    images = files.getlist("uploaded_images")
    for i, img in enumerate(images):
        is_primary = (i == 0 and not product.images.filter(is_primary=True).exists())
        ProductImage.objects.create(
            product=product,
            image=img,
            is_primary=is_primary,
            order=product.images.count() + i,
        )


class AdminProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAdminUser]
    filterset_class = ProductFilter
    pagination_class = StandardPagePagination
    search_fields = ["name", "sku", "brand"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Product.objects.all().select_related("category").prefetch_related("images")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductWriteSerializer
        return ProductListSerializer

    def perform_create(self, serializer):
        product = serializer.save()
        _save_uploaded_images(product, self.request.FILES)
        cache.delete("categories_tree")


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAdminUser]
    queryset = Product.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ProductWriteSerializer
        return ProductDetailSerializer

    def perform_update(self, serializer):
        product = serializer.save()
        _save_uploaded_images(product, self.request.FILES)
        cache.delete(f"product_detail_{product.slug}")

    def perform_destroy(self, instance):
        cache.delete(f"product_detail_{instance.slug}")
        instance.delete()


class AdminProductImageView(generics.CreateAPIView):
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        product = Product.objects.get(pk=self.kwargs["pk"])
        serializer.save(product=product)


class AdminProductVariantListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return ProductVariant.objects.filter(product_id=self.kwargs["pk"])

    def perform_create(self, serializer):
        serializer.save(product_id=self.kwargs["pk"])


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def bulk_csv_import(request):
    csv_file = request.FILES.get("file")
    if not csv_file:
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

    decoded = csv_file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    created, errors = [], []

    for row in reader:
        try:
            category, _ = Category.objects.get_or_create(
                slug=row.get("category_slug", ""),
                defaults={"name": row.get("category_name", "Uncategorized")},
            )
            Product.objects.update_or_create(
                sku=row["sku"],
                defaults={
                    "name": row["name"],
                    "description": row.get("description", ""),
                    "category": category,
                    "price": float(row["price"]),
                    "discount_price": float(row["discount_price"]) if row.get("discount_price") else None,
                    "stock": int(row.get("stock", 0)),
                    "brand": row.get("brand", ""),
                },
            )
            created.append(row["sku"])
        except Exception as e:
            errors.append({"sku": row.get("sku"), "error": str(e)})

    return Response({"created": len(created), "errors": errors})
