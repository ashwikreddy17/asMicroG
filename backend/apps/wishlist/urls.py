from django.urls import path
from .views import get_wishlist, toggle_wishlist, remove_wishlist_item

urlpatterns = [
    path("", get_wishlist, name="wishlist"),
    path("toggle/", toggle_wishlist, name="toggle_wishlist"),
    path("<int:pk>/", remove_wishlist_item, name="remove_wishlist"),
]
