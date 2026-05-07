"""
Auto-selects settings module based on the environment.

  Local dev  →  development.py   (DEBUG=True, local DB, console email, eager Celery)
  Production →  production.py    (DEBUG=False, SSL, Cloudinary, real email)

How it decides:
  - Render sets  RENDER=true        automatically on their platform
  - Railway sets RAILWAY_ENVIRONMENT automatically
  - You can also set DJANGO_ENV=production manually anywhere

No changes to manage.py or wsgi.py needed — just set the env var on the host.
"""
import os

_IS_RENDER   = bool(os.environ.get("RENDER"))
_IS_RAILWAY  = bool(os.environ.get("RAILWAY_ENVIRONMENT"))
_DJANGO_ENV  = os.environ.get("DJANGO_ENV", "development").lower()

if _IS_RENDER or _IS_RAILWAY or _DJANGO_ENV == "production":
    from .production import *   # noqa: F401, F403
else:
    from .development import *  # noqa: F401, F403
