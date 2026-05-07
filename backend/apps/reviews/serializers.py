from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            "id", "user", "user_name", "user_avatar", "product", "rating",
            "title", "comment", "is_verified_purchase", "is_approved",
            "helpful_count", "created_at",
        )
        read_only_fields = ("user", "is_verified_purchase", "is_approved", "helpful_count", "created_at")

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_user_avatar(self, obj):
        if obj.user.avatar:
            return obj.user.avatar.url
        return None

    def validate_product(self, value):
        request = self.context.get("request")
        if request and Review.objects.filter(user=request.user, product=value).exists():
            raise serializers.ValidationError("You have already reviewed this product.")
        return value
