from django.urls import path
from .views import get_cart, add_to_cart, update_cart_item, remove_cart_item, clear_cart, merge_guest_cart

urlpatterns = [
    path("", get_cart, name="cart"),
    path("add/", add_to_cart, name="add_to_cart"),
    path("items/<int:item_id>/", update_cart_item, name="update_cart_item"),
    path("items/<int:item_id>/remove/", remove_cart_item, name="remove_cart_item"),
    path("clear/", clear_cart, name="clear_cart"),
    path("merge/", merge_guest_cart, name="merge_cart"),
]
