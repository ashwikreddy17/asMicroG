from django.contrib import admin
from django.core.cache import cache
from .models import Banner


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("title", "position", "is_active", "order", "valid_from", "valid_until")
    list_filter = ("position", "is_active")
    list_editable = ("is_active", "order")
    ordering = ("position", "order")

    def _clear_cache(self, instance):
        cache.delete(f"banners_{instance.position}")

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        self._clear_cache(obj)

    def delete_model(self, request, obj):
        self._clear_cache(obj)
        super().delete_model(request, obj)

    def delete_queryset(self, request, queryset):
        positions = set(queryset.values_list("position", flat=True))
        super().delete_queryset(request, queryset)
        for pos in positions:
            cache.delete(f"banners_{pos}")
