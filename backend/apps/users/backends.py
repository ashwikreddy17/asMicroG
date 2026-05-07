import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User

_firebase_app = None


def get_firebase_app():
    global _firebase_app
    if _firebase_app is None and settings.FIREBASE_CREDENTIALS.get("project_id"):
        try:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS)
            _firebase_app = firebase_admin.initialize_app(cred)
        except ValueError:
            _firebase_app = firebase_admin.get_app()
    return _firebase_app


class FirebaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        firebase_token = request.META.get("HTTP_X_FIREBASE_TOKEN")
        if not firebase_token:
            return None

        app = get_firebase_app()
        if not app:
            return None

        try:
            decoded = firebase_auth.verify_id_token(firebase_token)
        except Exception:
            raise AuthenticationFailed("Invalid Firebase token.")

        uid = decoded.get("uid")
        email = decoded.get("email", "")
        name = decoded.get("name", "")

        user, created = User.objects.get_or_create(
            firebase_uid=uid,
            defaults={
                "email": email,
                "username": email or uid,
                "first_name": name.split(" ")[0] if name else "",
                "last_name": " ".join(name.split(" ")[1:]) if name else "",
                "is_verified": decoded.get("email_verified", False),
            },
        )

        if user.is_banned:
            raise AuthenticationFailed("Account is suspended.")

        return user, None
