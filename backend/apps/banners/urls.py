from django.urls import path
from .views import BannerListView, AdminBannerListCreateView, AdminBannerDetailView

urlpatterns = [
    path("", BannerListView.as_view(), name="banner_list"),
    path("admin/banners/", AdminBannerListCreateView.as_view(), name="admin_banner_list"),
    path("admin/banners/<int:pk>/", AdminBannerDetailView.as_view(), name="admin_banner_detail"),
]
