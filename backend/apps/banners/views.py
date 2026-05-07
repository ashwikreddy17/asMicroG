from rest_framework import generics, permissions
from rest_framework.response import Response
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
from .models import Banner
from .serializers import BannerSerializer


class BannerListView(generics.ListAPIView):
    serializer_class = BannerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        now = timezone.now()
        from django.db.models import Q
        return Banner.objects.filter(
            is_active=True,
        ).filter(
            Q(valid_from__isnull=True) | Q(valid_from__lte=now)
        ).filter(
            Q(valid_until__isnull=True) | Q(valid_until__gte=now)
        )

    def list(self, request, *args, **kwargs):
        position = request.query_params.get("position", "hero")
        cache_key = f"banners_{position}"
        data = cache.get(cache_key)
        if data is None:
            qs = self.get_queryset().filter(position=position)
            data = BannerSerializer(qs, many=True).data
            cache.set(cache_key, data, settings.CACHE_TTL_BANNER)
        return Response(data)


class AdminBannerListCreateView(generics.ListCreateAPIView):
    serializer_class = BannerSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Banner.objects.all()

    def perform_create(self, serializer):
        banner = serializer.save()
        cache.delete(f"banners_{banner.position}")


class AdminBannerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BannerSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Banner.objects.all()

    def perform_update(self, serializer):
        banner = serializer.save()
        cache.delete(f"banners_{banner.position}")

    def perform_destroy(self, instance):
        cache.delete(f"banners_{instance.position}")
        instance.delete()
