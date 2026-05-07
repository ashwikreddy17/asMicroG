"""
Production settings — loaded automatically on Render (RENDER=true),
Railway (RAILWAY_ENVIRONMENT), or when DJANGO_ENV=production.

All secrets come from the host's environment variables (Render / Railway dashboard).
No .env file is read on the server — secrets are injected by the platform.
"""
from .base import *  # noqa: F401, F403

DEBUG = False

# ── Security hardening ────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = [
    "https://*.onrender.com",
    "https://*.railway.app",
    "https://*.vercel.app",
]

# ── Static files via WhiteNoise (already in MIDDLEWARE via base) ──
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ── Media via Cloudinary ──────────────────────────────────────
DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

# ── Email via real SMTP ───────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

# ── Celery: use real broker in production ─────────────────────
CELERY_TASK_ALWAYS_EAGER = False

# ── Logging: warnings and errors only ────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {"handlers": ["console"], "level": "WARNING"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "celery": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}
