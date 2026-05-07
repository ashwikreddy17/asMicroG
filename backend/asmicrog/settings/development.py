"""
Development settings — loaded automatically when DJANGO_ENV is not "production"
and the app is not running on Render or Railway.

Loads secrets from backend/.env.local  (gitignored, never committed).
"""
import os
from pathlib import Path
from decouple import AutoConfig

# Point decouple at backend/.env.local instead of the default .env
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
config = AutoConfig(search_path=_BACKEND_DIR)   # picks up .env.local first, then .env

from .base import *  # noqa: E402, F401, F403

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# ── Email: print to terminal — no real emails sent ────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ── CORS: allow specific origins with credentials ─────────────
# CORS_ALLOW_ALL_ORIGINS cannot be used with CORS_ALLOW_CREDENTIALS=True
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

# ── Session: use DB backend — no Redis needed in dev ──────────
SESSION_ENGINE = "django.contrib.sessions.backends.db"

# ── Cache: in-memory — no Redis needed in dev ─────────────────
# This makes all cache.get/set calls actually work, which is the
# biggest single performance improvement for local development.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "asmicrog-dev",
    }
}

# ── Media: use local filesystem — Cloudinary not required ─────
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
MEDIA_ROOT = _BACKEND_DIR / "media"
MEDIA_URL = "/media/"

# ── Celery: run tasks synchronously — no broker needed ────────
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ── Security: relaxed for local ───────────────────────────────
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# ── Throttling: disable in dev so testing isn't rate-limited ──
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {}

# ── Logging: show SQL queries and debug output ────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {"handlers": ["console"], "level": "DEBUG"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "django.db.backends": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}
