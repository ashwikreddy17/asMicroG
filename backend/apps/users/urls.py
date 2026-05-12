from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import (
    RegisterView, LoginView, ProfileView, ChangePasswordView,
    AddressListCreateView, AddressDetailView,
    AdminUserListView, AdminUserDetailView, ban_user, unban_user,
    firebase_login,
)

urlpatterns = [
    # Auth
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("firebase/", firebase_login, name="firebase_login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", TokenBlacklistView.as_view(), name="logout"),

    # Profile
    path("profile/", ProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),

    # Addresses
    path("addresses/", AddressListCreateView.as_view(), name="address_list"),
    path("addresses/<int:pk>/", AddressDetailView.as_view(), name="address_detail"),

    # Admin
    path("admin/users/", AdminUserListView.as_view(), name="admin_user_list"),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="admin_user_detail"),
    path("admin/users/<int:pk>/ban/", ban_user, name="ban_user"),
    path("admin/users/<int:pk>/unban/", unban_user, name="unban_user"),
]
