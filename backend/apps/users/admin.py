from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Address


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "username", "first_name", "last_name", "is_verified", "is_banned", "date_joined")
    list_filter = ("is_active", "is_staff", "is_verified", "is_banned")
    search_fields = ("email", "username", "first_name", "last_name", "phone")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Extended Info", {"fields": ("phone", "avatar", "bio", "date_of_birth", "firebase_uid", "is_verified", "is_banned", "ban_reason")}),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "city", "state", "country", "is_default")
    list_filter = ("country", "state", "is_default")
    search_fields = ("user__email", "full_name", "city", "postal_code")
