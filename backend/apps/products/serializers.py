from rest_framework import serializers
from .models import Category, Product, ProductVariant, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "image", "description", "is_active", "parent", "children")

    def get_children(self, obj):
        children_qs = obj.get_children()
        if children_qs.exists():
            return CategorySerializer(children_qs, many=True).data
        return []

    def validate_slug(self, value):
        return value or None

    def create(self, validated_data):
        if not validated_data.get("slug"):
            from django.utils.text import slugify
            base = slugify(validated_data["name"])
            slug, i = base, 1
            while Category.objects.filter(slug=slug).exists():
                slug = f"{base}-{i}"; i += 1
            validated_data["slug"] = slug
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = instance.slug
        return super().update(instance, validated_data)


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "is_primary", "order")


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ("id", "variant_type", "name", "value", "price_adjustment", "stock", "sku", "is_active")


class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    effective_price = serializers.ReadOnlyField()
    discount_percent = serializers.ReadOnlyField()
    category_name = serializers.CharField(source="category.name", read_only=True)
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "short_description", "category", "category_name",
            "brand", "price", "discount_price", "effective_price", "discount_percent",
            "stock", "is_active", "is_featured", "primary_image",
            "average_rating", "review_count", "created_at",
        )

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            return ProductImageSerializer(img).data
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    effective_price = serializers.ReadOnlyField()
    discount_percent = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = "__all__"


class ProductWriteSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Product
        fields = (
            "name", "description", "short_description", "category",
            "brand", "sku", "price", "discount_price", "stock",
            "weight", "is_active", "is_featured", "meta_title",
            "meta_description", "tags",
        )

    def _generate_sku(self, name):
        import uuid
        prefix = name[:3].upper().replace(" ", "")
        return f"{prefix}-{uuid.uuid4().hex[:6].upper()}"

    def create(self, validated_data):
        if not validated_data.get("sku"):
            validated_data["sku"] = self._generate_sku(validated_data.get("name", "PRD"))
        if not validated_data.get("slug"):
            from django.utils.text import slugify
            base = slugify(validated_data["name"])
            slug, i = base, 1
            while Product.objects.filter(slug=slug).exists():
                slug = f"{base}-{i}"; i += 1
            validated_data["slug"] = slug
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if not validated_data.get("sku"):
            validated_data["sku"] = instance.sku
        if not validated_data.get("slug"):
            validated_data["slug"] = instance.slug
        return super().update(instance, validated_data)
